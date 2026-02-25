import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit {
  private client!: MongoClient;
  private db!: Db;

  async onModuleInit() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI não definido no .env');

    this.client = new MongoClient(uri);
    await this.client.connect();

    const dbName = process.env.MONGO_DB || 'bigquery';
    this.db = this.client.db(dbName);

    // índices úteis
    await this.db.collection('leads').createIndex({ email: 1 }, { unique: true });
    await this.db.collection('leads').createIndex({ setor_empresa: 1 });
    await this.db.collection('leads').createIndex({ estado_empresa: 1 });
    await this.db.collection('leads').createIndex({ cargo: 1 });
    await this.db.collection('leads').createIndex({ client: 1 });
    await this.db.collection('campaigns').createIndex({ created_at: -1 });
  }

  getDb() {
    return this.db;
  }
}
