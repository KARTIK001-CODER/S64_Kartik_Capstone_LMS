// server.js

import dotenv from 'dotenv';
dotenv.config();

import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import express from 'express';
import passport from 'passport';
import fs from 'fs';
import path from 'path';
import connectDB from './config/mongodb.js';
import './config/passport.js';  // Import passport config
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
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// ── Env validation ──────────────────────────────────────────────
const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredVars.filter(v => !process.env[v] || process.env[v].startsWith('your_'));
if (missing.length > 0) {
  console.error(`Missing or placeholder environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

connectDB(); // Connect to MongoDB

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ────────────────────────────────────────────
app.use(helmet());

// ── Request logging ─────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ───────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Body parsing & sanitization ─────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(passport.initialize());

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/certificates', certificateRoutes);

// ── API Docs (Swagger) ──────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LMS API Docs',
}));

// ── Static files ────────────────────────────────────────────────
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

// ── Error handling ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
