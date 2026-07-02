import express from 'express';
import { protect, educatorOnly } from '../middleware/authMiddleware.js';
import { getDashboardStats, getEnrolledStudents, getLearners, exportLearnersCSV, getReportData, exportReportCSV, exportReportPDF, getReviews, addReviewReply, getProfile, updateProfile, getSettings, updateSettings } from '../controllers/educatorController.js';
import { uploadAvatar } from '../middleware/upload.js';
import { objectIdValidation, reviewReplyValidation, profileUpdateValidation } from '../middleware/validation.js';

const router = express.Router();

router.use(protect, educatorOnly);

/**
 * @openapi
 * /api/educator/dashboard/stats:
 *   get:
 *     summary: Get educator dashboard statistics
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats including courses, students, revenue
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @openapi
 * /api/educator/courses/{courseId}/enrolled-students:
 *   get:
 *     summary: Get enrolled students for a course
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of enrolled students
 */
router.get('/courses/:courseId/enrolled-students', objectIdValidation, getEnrolledStudents);

/**
 * @openapi
 * /api/educator/learners:
 *   get:
 *     summary: Get paginated list of learners with progress
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: courseId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, completed] }
 *     responses:
 *       200:
 *         description: Paginated list of learners
 */
router.get('/learners', getLearners);

/**
 * @openapi
 * /api/educator/learners/export/csv:
 *   get:
 *     summary: Export learners data as CSV
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 */
router.get('/learners/export/csv', exportLearnersCSV);

/**
 * @openapi
 * /api/educator/reports:
 *   get:
 *     summary: Get educator report data with trends
 *     tags: [Educator]
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
 *         description: Report data with trends
 */
router.get('/reports', getReportData);

/**
 * @openapi
 * /api/educator/reports/export/csv:
 *   get:
 *     summary: Export report as CSV
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get('/reports/export/csv', exportReportCSV);

/**
 * @openapi
 * /api/educator/reports/export/pdf:
 *   get:
 *     summary: Export report as PDF
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file download
 */
router.get('/reports/export/pdf', exportReportPDF);

/**
 * @openapi
 * /api/educator/reviews:
 *   get:
 *     summary: Get reviews for educator's courses
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema: { type: string }
 *       - in: query
 *         name: rating
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 */
router.get('/reviews', getReviews);

/**
 * @openapi
 * /api/educator/courses/{courseId}/ratings/{ratingId}/reply:
 *   post:
 *     summary: Reply to a course review
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reply: { type: string }
 *     responses:
 *       200:
 *         description: Reply added
 */
router.post('/courses/:courseId/ratings/:ratingId/reply', reviewReplyValidation, addReviewReply);

/**
 * @openapi
 * /api/educator/profile:
 *   get:
 *     summary: Get educator profile
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *   put:
 *     summary: Update educator profile
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               headline: { type: string }
 *               bio: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.get('/profile', getProfile);
router.put('/profile', uploadAvatar.single('avatar'), profileUpdateValidation, updateProfile);

/**
 * @openapi
 * /api/educator/settings:
 *   get:
 *     summary: Get educator settings
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings data
 *   put:
 *     summary: Update educator settings
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaults: { type: object }
 *               visibility: { type: object }
 *               certificate: { type: object }
 *               enrollment: { type: object }
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
