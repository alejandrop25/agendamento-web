import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1]; 

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

app.get('/slots', async (req, res) => {
    try{
        const allSlots = await prisma.slot.findMany({
            include: {artist: true},
            orderBy: {startTime: 'asc'}
        });
        res.json(allSlots);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar horários' });
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
    } catch (error) {
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

app.delete('/cancel/:slotId', async (req, res) => {
    const { slotId } = req.params;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.appointment.delete({
                where: {slotId: slotId}
            });

            await tx.slot.update({
                where: {id: slotId},
                data: {isBooked: false}
            });
        });

        res.json({message: 'Agendamento cancelado com sucesso'})
    } catch(error){
        console.error(error);
        res.status(500).json({error: 'Erro ao cancelar agendamento'})
    }
});

app.get('/artists', async (req, res) => {
    try{
        const artists = await prisma.artist.findMany();
        res.json(artists);
    } catch(error) {
        res.status(500).json({ error: 'Erro ao buscar artistas'});
    }
});

app.post('/artists', authMiddleware, async (req, res) => {
    const { name, specialty } = req.body;
    try{
        const artist = await prisma.artist.create({
            data: { name, specialty }
        });
        res.status(201).json(artist);
    } catch(error) {
        res.status(500).json({ error: 'Erro ao criar artista'})
    }
});

app.post('/slots', authMiddleware, async (req, res) => {
    const { artistId, startTime, endTime } = req.body;
    try{
        const slot = await prisma.slot.create({
            data: { 
                artistId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                isBooked: false
             },
             include: { artist: true }
        });
    } catch(error) {
        res.status(500).json({ error: 'Erro ao criar horário' });
    }
});

app.post('/setup', async (req, res) => {
    const hashPassword = await bcrypt.hash('admin', 10);
    try{
        await prisma.user.create({
            data: {username: 'admin', password: hashPassword}
        });
        res.json({message: 'Admin criado'});
    } catch(error) {
        res.status(400).json({error: 'Erro ao criar admin'})
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. Busca o usuário
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

  // 2. Compara a senha digitada com a senha embaralhada do banco
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) return res.status(401).json({ error: 'Senha incorreta' });

  // 3. Se deu certo, gera o "crachá" (Token JWT) válido por 8 horas
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
  
  res.json({ token, message: 'Login bem-sucedido' });
});

