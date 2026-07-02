import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  enrollCourse,
  getEnrolledCourses,
  getCourseProgress,
  updateCourseProgress,
  updateLastWatched
} from '../controllers/enrollmentController.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/enrollments/student/enrolled-courses:
 *   get:
 *     summary: Get all enrolled courses for the logged-in student
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of enrollment objects with populated course data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Enrollment'
 */
router.get('/student/enrolled-courses', getEnrolledCourses);

/**
 * @openapi
 * /api/enrollments/student/enroll/{courseId}:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Enrollment created
 *       400:
 *         description: Already enrolled
 *       404:
 *         description: Course not found
 */
router.post('/student/enroll/:courseId', enrollCourse);

/**
 * @openapi
 * /api/enrollments/student/course/{courseId}/progress:
 *   get:
 *     summary: Get course progress for the logged-in student
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Progress object with lecture completion status
 *       404:
 *         description: Not enrolled
 */
router.get('/student/course/:courseId/progress', getCourseProgress);

/**
 * @openapi
 * /api/enrollments/student/course/{courseId}/progress:
 *   put:
 *     summary: Mark a lecture as completed
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lectureId]
 *             properties:
 *               lectureId: { type: string }
 *     responses:
 *       200:
 *         description: Updated enrollment with new progress
 *       404:
 *         description: Not enrolled
 */
router.put('/student/course/:courseId/progress', updateCourseProgress);

/**
 * @openapi
 * /api/enrollments/student/course/{courseId}/last-watched:
 *   put:
 *     summary: Update last-watched lecture position
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lectureId, chapterIndex, lectureIndex]
 *             properties:
 *               lectureId: { type: string }
 *               chapterIndex: { type: integer }
 *               lectureIndex: { type: integer }
 *     responses:
 *       200:
 *         description: Last-watched position updated
 *       404:
 *         description: Not enrolled
 */
router.put('/student/course/:courseId/last-watched', updateLastWatched);

export default router;
