import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRoutes } from './modules/auth/auth.route.js';
import { userRoutes } from './modules/user/user.route.js';
import { technicianRoutes } from './modules/technician/technician.route.js';
import { categoryRoutes } from './modules/category/category.route.js';
import { serviceRoutes } from './modules/service/service.route.js';
import { bookingRoutes } from './modules/booking/booking.route.js';
import { paymentRoutes } from './modules/payment/payment.route.js';
import { reviewRoutes } from './modules/review/review.route.js';
import { adminRoutes } from './modules/admin/admin.route.js';
import notFound from './middlewares/notFound.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/technicians', technicianRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
