import { defineConfig } from '@prisma/config';
import 'dotenv/config'; // Garante que ele leia o arquivo .env

export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL as string, // Aponta para a sua URL do Neon.tech
  },
});