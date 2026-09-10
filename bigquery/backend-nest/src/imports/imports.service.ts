import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoService } from '../mongo/mongo.service';
import { parseObjectId } from '../common/mongo-id.util';
import axios from 'axios';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

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
    const objectId = parseObjectId(importId, 'import');

    const importData = await db
      .collection('imports')
      .findOne({ _id: objectId });

    if (!importData)
      throw new HttpException('Import não encontrado', HttpStatus.NOT_FOUND);

    const etlUrl = this.configService.get(
      'ETL_URL',
      'http://localhost:8001/process',
    );
    const timeout = Number(this.configService.get('ETL_TIMEOUT_MS', 30000));

    let response;
    try {
      response = await axios.post(
        etlUrl,
        {
          import_id: importId,
          file_path: importData.file_path,
          mapping,
        },
        { timeout },
      );
    } catch (err) {
      this.logger.error(
        `Erro ao chamar ETL para import ${importId}`,
        err instanceof Error ? err.stack : err,
      );

      await db.collection('imports').updateOne(
        { _id: objectId },
        {
          $set: {
            status: 'error',
            error_at: new Date(),
            error_message:
              err instanceof Error
                ? err.message
                : 'Erro desconhecido ao chamar ETL',
          },
        },
      );

      throw new HttpException(
        'Erro ao chamar ETL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await db.collection('imports').updateOne(
      { _id: objectId },
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
