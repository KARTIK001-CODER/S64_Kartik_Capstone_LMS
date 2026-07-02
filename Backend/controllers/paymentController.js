import asyncHandler from 'express-async-handler';
import * as paymentService from '../services/paymentService.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    res.status(400);
    throw new Error('Course ID is required');
  }
  const result = await paymentService.createOrder(req.user._id, courseId);
  res.status(201).json(result);
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment(req.body);
  res.json(result);
});
