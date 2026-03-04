import 'dotenv/config'; // Garante que o process.env.DATABASE_URL seja lido
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. Configura o motor nativo do Postgres apontando para o seu Neon.tech
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Agora o Prisma 7 fica feliz pois passamos o adaptador para ele!
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando o seed...');

  // Cria um artista
  const artist = await prisma.artist.create({
    data: {
      name: 'João Tatuador',
      specialty: 'Realismo e Blackwork',
    },
  });

  console.log(`Artista criado: ${artist.name}`);

  // Cria alguns horários (Slots) para amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 14:00

  const slot1 = new Date(tomorrow);
  const slot1End = new Date(tomorrow);
  slot1End.setHours(15, 0, 0, 0); // 15:00

  const slot2 = new Date(tomorrow);
  slot2.setHours(15, 30, 0, 0); // 15:30
  const slot2End = new Date(tomorrow);
  slot2End.setHours(16, 30, 0, 0); // 16:30

  await prisma.slot.createMany({
    data: [
      {
        artistId: artist.id,
        startTime: slot1,
        endTime: slot1End,
        isBooked: false,
      },
      {
        artistId: artist.id,
        startTime: slot2,
        endTime: slot2End,
        isBooked: false,
      },
    ],
  });

  console.log('✅ Horários (Slots) criados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    // @ts-ignore (Caso o seu VS Code ainda esteja teimoso com o process)
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Precisamos fechar a conexão do Pool no final
  });