import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  res.json(notifications);
});

export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, link } = req.body;

  if (userId && userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to create notifications for other users');
  }

  const notification = await Notification.create({
    userId: userId || req.user._id,
    title,
    message,
    type,
    link,
  });
  res.status(201).json(notification);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this notification');
  }

  notification.isRead = true;
  await notification.save();
  res.json(notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});
