import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// TypeScript exige que tenhamos certeza de que a variável de ambiente existe
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
    throw new Error("A variável JWT_SECRET não está definida no arquivo .env");
}

const app = express();
app.use(cors());
app.use(express.json());

// Adicionamos os tipos Request, Response e NextFunction do Express
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return; // Usamos return vazio para o TS entender que a função para aqui
  }

  const token = authHeader.split(' ')[1] as string; 

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

app.get('/slots', async (req: Request, res: Response) => {
    try {
        const allSlots = await prisma.slot.findMany({
            include: { artist: true },
            orderBy: { startTime: 'asc' }
        });
        res.json(allSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar horários' });
    }
});

app.post('/reserve', async (req: Request, res: Response) => {
    const { slotId, clientName, clientEmail } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const slot = await tx.slot.findUnique({
                where: { id: slotId },
            });
            
            // Ajustei o texto do erro para bater com o seu tratamento de erros no catch
            if (!slot) {
                throw new Error('SLOT_NOT_FOUND'); 
            }
            if (slot.isBooked) {
                throw new Error('ALREADY_BOOKED');
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
    } catch (error: any) { // "any" é usado para podermos ler a propriedade error.message
        if (error.message === 'ALREADY_BOOKED' || error.code === 'P2002') {
            res.status(409).json({ error: 'Desculpe, este horário acabou de ser reservado por outra pessoa.' });
        } else if (error.message === 'SLOT_NOT_FOUND') {
            res.status(404).json({ error: 'Horário não encontrado.' });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }
});

app.delete('/cancel/:slotId', async (req: Request, res: Response) => {
    const slotId = req.params.slotId as string;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.appointment.delete({
                where: { slotId: slotId }
            });

            await tx.slot.update({
                where: { id: slotId },
                data: { isBooked: false }
            });
        });

        res.json({ message: 'Agendamento cancelado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar agendamento' });
    }
});

app.get('/artists', async (req: Request, res: Response) => {
    try {
        const artists = await prisma.artist.findMany();
        res.json(artists);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar artistas' });
    }
});

app.post('/artists', authMiddleware, async (req: Request, res: Response) => {
    const { name, specialty } = req.body;
    try {
        const artist = await prisma.artist.create({
            data: { name, specialty }
        });
        res.status(201).json(artist);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar artista' });
    }
});

app.post('/slots', authMiddleware, async (req: Request, res: Response) => {
    const { artistId, startTime, endTime } = req.body;
    try {
        const slot = await prisma.slot.create({
            data: { 
                artistId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                isBooked: false
            },
            include: { artist: true }
        });
        // IMPORTANTE: Adicionado o retorno do json, senão a requisição fica travada!
        res.status(201).json(slot); 
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar horário' });
    }
});

app.post('/setup', async (req: Request, res: Response) => {
    const hashPassword = await bcrypt.hash('admin', 10);
    try {
        await prisma.user.create({
            data: { username: 'admin', password: hashPassword }
        });
        res.json({ message: 'Admin criado' });
    } catch (error) {
        res.status(400).json({ error: 'Erro ao criar admin' });
    }
});

// A rota de login foi movida para cima do app.listen!
app.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        res.status(401).json({ error: 'Senha incorreta' });
        return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, message: 'Login bem-sucedido' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});