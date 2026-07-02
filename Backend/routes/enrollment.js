import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  enrollCourse,
  getEnrolledCourses,
  getCourseProgress,
  updateCourseProgress,
  updateLastWatched
} from '../controllers/enrollmentController.js';
import {
  courseIdValidation,
  progressUpdateValidation,
  lastWatchedValidation,
} from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /api/enrollments:
 *   get:
 *     summary: Get all enrolled courses for current user
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrollments with course details
 */
router.get('/', getEnrolledCourses);

/**
 * @openapi
 * /api/enrollments/enroll/{courseId}:
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
 *         description: Enrolled successfully
 *       400:
 *         description: Already enrolled
 */
router.post('/enroll/:courseId', courseIdValidation, enrollCourse);

/**
 * @openapi
 * /api/enrollments/{courseId}/progress:
 *   get:
 *     summary: Get progress for a specific course
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
 *         description: Course progress data
 */
router.get('/:courseId/progress', courseIdValidation, getCourseProgress);

/**
 * @openapi
 * /api/enrollments/{courseId}/progress:
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
 *             properties:
 *               lectureId: { type: string }
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.put('/:courseId/progress', courseIdValidation, progressUpdateValidation, updateCourseProgress);

/**
 * @openapi
 * /api/enrollments/{courseId}/last-watched:
 *   put:
 *     summary: Update last watched lecture
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
 *             properties:
 *               lectureId: { type: string }
 *               chapterIndex: { type: integer }
 *               lectureIndex: { type: integer }
 *     responses:
 *       200:
 *         description: Last watched updated
 */
router.put('/:courseId/last-watched', courseIdValidation, lastWatchedValidation, updateLastWatched);

export default router;
