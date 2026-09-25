import dotenv from 'dotenv';
dotenv.config();
export const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/spendsage',
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    AI_API_KEY: process.env.AI_API_KEY || '',
    AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads/'
};
