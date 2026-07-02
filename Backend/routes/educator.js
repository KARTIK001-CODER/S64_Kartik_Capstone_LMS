import express from 'express';
import { protect, educatorOnly } from '../middleware/authMiddleware.js';
import { getDashboardStats, getEnrolledStudents, getLearners, exportLearnersCSV, getReportData, exportReportCSV, exportReportPDF, getReviews, addReviewReply, getProfile, updateProfile, getSettings, updateSettings } from '../controllers/educatorController.js';
import { uploadAvatar } from '../middleware/upload.js';

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
 *         description: Dashboard stats including courses, students, enrollments, ratings, trends
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @openapi
 * /api/educator/courses/{courseId}/enrolled-students:
 *   get:
 *     summary: Get enrolled students for a specific course
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
 *         description: Array of enrolled student objects
 *       404:
 *         description: Course not found or unauthorized
 */
router.get('/courses/:courseId/enrolled-students', getEnrolledStudents);
router.get('/learners', getLearners);
router.get('/learners/export/csv', exportLearnersCSV);
router.get('/reports', getReportData);
router.get('/reports/export/csv', exportReportCSV);
router.get('/reports/export/pdf', exportReportPDF);
router.get('/reviews', getReviews);
router.post('/courses/:courseId/ratings/:ratingId/reply', addReviewReply);
router.get('/profile', getProfile);
router.put('/profile', uploadAvatar.single('avatar'), updateProfile);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
