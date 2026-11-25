import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value at least 32 characters long.');
}

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by CORS.'));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.get('/', (req, res) => res.send('Bandai Namco IMS API is running'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/logs', logRoutes);
app.use(notFound);
app.use(errorHandler);

await connectToDatabase();
const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

async function shutdown(signal) {
  console.log(`${signal} received; closing server.`);
  server.close(async () => {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
