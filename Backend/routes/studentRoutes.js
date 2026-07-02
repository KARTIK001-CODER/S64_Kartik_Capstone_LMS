import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getDashboard, getProfile } from '../controllers/studentController.js';

const router = express.Router();

/**
 * @openapi
 * /api/student/dashboard:
 *   get:
 *     summary: Get student dashboard data (continue learning, statistics, activity, recommendations)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data object
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @openapi
 * /api/student/profile:
 *   get:
 *     summary: Get student profile with learning summary and certificates
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', protect, getProfile);

export default router;
