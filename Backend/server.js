import dotenv from 'dotenv';
dotenv.config();

import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import express from 'express';
import passport from 'passport';
import fs from 'fs';
import path from 'path';
import connectDB from './config/mongodb.js';
import './config/passport.js';
import logger from './utils/logger.js';
import requestId from './middleware/requestId.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollmentRoutes from './routes/enrollment.js';
import llmRoutes from './routes/llmRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import paymentRoutes from './routes/payment.js';
import educatorRoutes from './routes/educator.js';
import studentRoutes from './routes/studentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import healthRoutes from './routes/health.js';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const requiredVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredVars.filter(v => !process.env[v] || process.env[v].startsWith('your_'));
if (missing.length > 0) {
  logger.error(`Missing or placeholder environment variables: ${missing.join(', ')}`);
  logger.error('Copy .env.example to .env and fill in the required values.');
  process.exit(1);
}

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://*.cloudinary.com"],
      fontSrc: ["'self'"],
      frameSrc: ["'self'", "https://*.youtube.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.disable('x-powered-by');

app.use(requestId);

app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const llmLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many LLM requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(mongoSanitize());
app.use(hpp({
  whitelist: ['page', 'limit', 'search', 'category', 'difficulty', 'language', 'status', 'rating', 'startDate', 'endDate'],
}));
app.use(passport.initialize());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/courses', apiLimiter, courseRoutes);
app.use('/api/enrollments', apiLimiter, enrollmentRoutes);
app.use('/api/llm', llmLimiter, llmRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/educator', apiLimiter, educatorRoutes);
app.use('/api/student', apiLimiter, studentRoutes);
app.use('/api/certificates', apiLimiter, certificateRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LMS API Docs',
}));

const uploadsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const clientDist = process.env.CLIENT_DIST;
if (clientDist) {
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(clientDist, 'index.html'));
    }
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, `Server running on http://localhost:${PORT}`);
});
