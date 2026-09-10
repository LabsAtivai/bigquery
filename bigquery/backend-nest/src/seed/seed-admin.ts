import 'dotenv/config';
import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI não definido no .env');

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD são obrigatórios no .env',
    );
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const dbName = process.env.MONGO_DB || 'bigquery';
    const db = client.db(dbName);
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.collection('users').updateOne(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          passwordHash,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );

    console.log(
      `Usuário admin "${normalizedEmail}" criado/atualizado com sucesso.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Erro ao rodar seed do admin:', err);
  process.exit(1);
});
