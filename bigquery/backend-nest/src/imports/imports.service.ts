import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoService } from '../mongo/mongo.service';
import { ObjectId } from 'mongodb';
import axios from 'axios';

@Injectable()
export class ImportsService {
  constructor(
    private mongoService: MongoService,
    private configService: ConfigService,
  ) {}

  async create(filePath: string) {
    const db = this.mongoService.getDb();

    const result = await db.collection('imports').insertOne({
      file_path: filePath,
      status: 'uploaded',
      created_at: new Date(),
    });

    return result.insertedId;
  }

  async process(importId: string, mapping: any) {
    const db = this.mongoService.getDb();

    const importData = await db
      .collection('imports')
      .findOne({ _id: new ObjectId(importId) });

    if (!importData) throw new HttpException('Import não encontrado', HttpStatus.NOT_FOUND);

    const etlUrl = this.configService.get('ETL_URL', 'http://localhost:8001/process');

    let response;
    try {
      response = await axios.post(etlUrl, {
        import_id: importId,
        file_path: importData.file_path,
        mapping,
      });
    } catch (err) {
      throw new HttpException('Erro ao chamar ETL', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await db.collection('imports').updateOne(
      { _id: new ObjectId(importId) },
      {
        $set: {
          status: 'processed',
          processed_at: new Date(),
          stats: response.data,
        },
      },
    );

    return response.data;
  }
}