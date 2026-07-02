import express from 'express';
import { protect, educatorOnly } from '../middleware/authMiddleware.js';
import { getReportSummary, exportCSV, exportPDF } from '../controllers/reportController.js';

const router = express.Router();

router.use(protect, educatorOnly);

/**
 * @openapi
 * /api/reports/summary:
 *   get:
 *     summary: Get educator dashboard report summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Report summary data
 */
router.get('/summary', getReportSummary);

/**
 * @openapi
 * /api/reports/export/csv:
 *   get:
 *     summary: Export report as CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get('/export/csv', exportCSV);

/**
 * @openapi
 * /api/reports/export/pdf:
 *   get:
 *     summary: Export report as PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 */
router.get('/export/pdf', exportPDF);

export default router;
