import express from 'express';
import { 
  getNotifications, 
  createNotification, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/:userId', getNotifications);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all', markAllAsRead);

export default router;
