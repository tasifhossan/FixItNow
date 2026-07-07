import express from 'express';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { authRoutes } from './modules/auth/auth.route.js';
import { userRoutes } from './modules/user/user.route.js';
import type { Request, Response, NextFunction } from 'express';

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null,
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
});
