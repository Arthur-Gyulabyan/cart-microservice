import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbPath: process.env.DB_PATH || './data/cart.db',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173',
};
