import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

/**
 * @openapi
 * /api/payments/create-order:
 *   post:
 *     summary: Create a Razorpay order for a course
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId: { type: string }
 *     responses:
 *       201:
 *         description: Razorpay order created (or dev-mode enrollment)
 */
router.post('/create-order', protect, createOrder);

/**
 * @openapi
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment signature and create enrollment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       201:
 *         description: Payment verified and enrollment created
 *       400:
 *         description: Invalid signature
 */
router.post('/verify', protect, verifyPayment);

export default router;
