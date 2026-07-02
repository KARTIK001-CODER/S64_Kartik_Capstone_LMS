import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateCertificate,
  getCertificate,
  getMyCertificates,
  downloadCertificate,
} from '../controllers/certificateController.js';

const router = express.Router();

router.get('/my', protect, getMyCertificates);
router.post('/generate/:courseId', protect, generateCertificate);
router.get('/:courseId', protect, getCertificate);
router.get('/download/:certificateId', protect, downloadCertificate);

export default router;
