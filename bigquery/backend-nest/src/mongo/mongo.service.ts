import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

const CONNECT_RETRIES = 5;
const CONNECT_RETRY_DELAY_MS = 3000;

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);
  private client!: MongoClient;
  private db!: Db;

  async onModuleInit() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI não definido no .env');

    this.client = new MongoClient(uri);
    await this.connectWithRetry();

    const dbName = process.env.MONGO_DB || 'bigquery';
    this.db = this.client.db(dbName);

    await this.ensureIndexes();
  }

  private async connectWithRetry() {
    for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
      try {
        await this.client.connect();
        return;
      } catch (err) {
        const isLast = attempt === CONNECT_RETRIES;
        this.logger.error(
          `Falha ao conectar no MongoDB (tentativa ${attempt}/${CONNECT_RETRIES})`,
          err instanceof Error ? err.stack : err,
        );
        if (isLast) throw err;
        await new Promise((resolve) =>
          setTimeout(resolve, CONNECT_RETRY_DELAY_MS),
        );
      }
    }
  }

  // índices úteis; falha ao criar um índice (ex: dado duplicado já
  // existente) não pode derrubar a aplicação inteira — só loga o erro.
  private async ensureIndexes() {
    const indexes: Array<[string, Record<string, 1 | -1>, boolean?]> = [
      ['leads', { email: 1 }, true],
      ['leads', { setor_empresa: 1 }],
      ['leads', { estado_empresa: 1 }],
      ['leads', { cargo: 1 }],
      ['leads', { client: 1 }],
      ['campaigns', { created_at: -1 }],
      ['users', { email: 1 }, true],
    ];

    for (const [collection, spec, unique] of indexes) {
      try {
        await this.db.collection(collection).createIndex(spec, { unique });
      } catch (err) {
        this.logger.error(
          `Falha ao criar índice ${JSON.stringify(spec)} em "${collection}" (dado duplicado?)`,
          err instanceof Error ? err.stack : err,
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.client?.close();
  }

  getDb() {
    return this.db;
  }
}
