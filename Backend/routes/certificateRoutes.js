import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateCertificate,
  getCertificate,
  getMyCertificates,
  downloadCertificate,
} from '../controllers/certificateController.js';
import { objectIdValidation, courseIdValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @openapi
 * /api/certificates/my:
 *   get:
 *     summary: Get all certificates for the logged-in user
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of certificates
 */
router.get('/my', protect, getMyCertificates);

/**
 * @openapi
 * /api/certificates/generate/{courseId}:
 *   post:
 *     summary: Generate a certificate for a completed course
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Certificate generated
 *       400:
 *         description: Course not completed yet
 */
router.post('/generate/:courseId', protect, courseIdValidation, generateCertificate);

/**
 * @openapi
 * /api/certificates/{courseId}:
 *   get:
 *     summary: Get certificate for a specific course
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Certificate data
 *       404:
 *         description: Certificate not found
 */
router.get('/:courseId', protect, courseIdValidation, getCertificate);

/**
 * @openapi
 * /api/certificates/download/{certificateId}:
 *   get:
 *     summary: Download certificate as PDF
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/download/:certificateId', protect, objectIdValidation, downloadCertificate);

export default router;
