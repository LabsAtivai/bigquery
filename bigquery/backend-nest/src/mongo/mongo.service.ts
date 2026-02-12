import { Injectable, OnModuleInit, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit {
  private client: MongoClient;
  private db: Db;
  private logger = new Logger(MongoService.name);

  async onModuleInit() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI não definido no .env');
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(process.env.MONGO_DB || 'bigquery');
      this.logger.log('Conectado ao MongoDB');
    } catch (err) {
      this.logger.error('Erro ao conectar ao MongoDB', err);
      throw new HttpException('Erro de conexão com banco', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getDb() {
    return this.db;
  }
}