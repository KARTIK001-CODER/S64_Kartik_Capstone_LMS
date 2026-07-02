import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';
import { notificationValidation } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               type: { type: string, enum: [system, enrollment, review, completion] }
 *               link: { type: string }
 *     responses:
 *       201:
 *         description: Notification created
 */
router.get('/', getNotifications);
router.post('/', notificationValidation, createNotification);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', markAsRead);

/**
 * @openapi
 * /api/notifications/mark-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/mark-all', markAllAsRead);

export default router;
