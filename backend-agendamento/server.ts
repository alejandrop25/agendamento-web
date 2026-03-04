import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/slots', async (req, res) => {
    try{
        const availableSlots = await prisma.slot.findMany({
            where: { isBooked: false },
            include: { artist: true },
            orderBy: { startTime: 'asc' }
        });
        res.json(availableSlots);
    }catch(error){
        console.error('Erro ao buscar slots:', error);
        res.status(500).json({ error: 'Erro ao buscar slots' });
    }
});

app.post('/reserve', async (req, res) => {
    const { slotId, clientName, clientEmail } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const slot = await tx.slot.findUnique({
                where: { id: slotId },
            });
            if(!slot){
                throw new Error('Slot não encontrado');
            }
            if(slot.isBooked){
                throw new Error('Slot já reservado');
            }
            const appointment = await tx.appointment.create({
                data: {
                    slotId,
                    clientName,
                    clientEmail,
                    status: 'confirmed',
                }
            });
            await tx.slot.update({
                where: { id: slotId },
                data: { isBooked: true },
            });
            return appointment;
        });
        res.status(201).json({
            message: 'Reserva confirmada!',
            appointment: result
        });
    } catch (error: any) {
    // Tratamento de erros elegante
    if (error.message === 'ALREADY_BOOKED' || error.code === 'P2002') {
      // P2002 é o código de erro do Prisma quando tentamos ferir a regra do @unique
      res.status(409).json({ error: 'Desculpe, este horário acabou de ser reservado por outra pessoa.' });
    } else if (error.message === 'SLOT_NOT_FOUND') {
      res.status(404).json({ error: 'Horário não encontrado.' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});