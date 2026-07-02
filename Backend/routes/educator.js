import express from 'express';
import { protect, educatorOnly } from '../middleware/authMiddleware.js';
import { getEnrolledStudents } from '../controllers/educatorController.js';

const router = express.Router();

router.use(protect, educatorOnly);

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

export default router;
