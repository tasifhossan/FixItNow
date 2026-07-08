import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  jwt: {
    secret: process.env.JWT_SECRET || 'verysecretaccesskey',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'verysecretrefreshkey',
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  sslcommerzStoreId: process.env.SSLCOMMERZ_STORE_ID,
  sslcommerzStorePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
  sslcommerzIsLive: process.env.SSLCOMMERZ_IS_LIVE === 'true',
  baseUrl: process.env.BASE_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
