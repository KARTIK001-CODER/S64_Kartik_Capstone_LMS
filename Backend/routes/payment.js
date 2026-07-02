import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { paymentValidation, verifyPaymentValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @openapi
 * /api/payments/create-order:
 *   post:
 *     summary: Create a payment order for course enrollment
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
 *       200:
 *         description: Payment order created
 */
router.post('/create-order', protect, paymentValidation, createOrder);

/**
 * @openapi
 * /api/payments/verify:
 *   post:
 *     summary: Verify payment and complete enrollment
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
 *       200:
 *         description: Payment verified and enrollment completed
 *       400:
 *         description: Invalid payment signature
 */
router.post('/verify', protect, verifyPaymentValidation, verifyPayment);

export default router;
