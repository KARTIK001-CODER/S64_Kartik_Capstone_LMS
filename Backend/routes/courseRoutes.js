import express from 'express';
import { protect, educatorOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import {
  addCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getEducatorCourses,
  addCourseRating,
  deleteCourseRating,
  duplicateCourse,
  bulkCourseAction
} from '../controllers/courseController.js';
import {
  courseValidation,
  ratingValidation,
  paginationValidation,
  objectIdValidation,
} from '../middleware/validation.js';

const router = express.Router();

/**
 * @openapi
 * /api/courses:
 *   get:
 *     summary: Get paginated list of published courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string }
 *       - in: query
 *         name: language
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, popular, price-asc, price-desc] }
 *     responses:
 *       200:
 *         description: Paginated list of courses
 */
router.get('/', paginationValidation, getCourses);

/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     summary: Get a single course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', objectIdValidation, getCourseById);

/**
 * @openapi
 * /api/courses/educator:
 *   get:
 *     summary: Get courses owned by the logged-in educator
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Educator's courses
 */
router.get('/educator', protect, educatorOnly, paginationValidation, getEducatorCourses);

/**
 * @openapi
 * /api/courses/bulk:
 *   post:
 *     summary: Perform bulk action on courses (publish, archive, delete)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action: { type: string }
 *               courseIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Bulk action completed
 */
router.post('/bulk', protect, educatorOnly, bulkCourseAction);

/**
 * @openapi
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               courseThumbnail: { type: string, format: binary }
 *               courseTitle: { type: string }
 *               courseDescription: { type: string }
 *               coursePrice: { type: number }
 *               category: { type: string }
 *               difficulty: { type: string }
 *     responses:
 *       201:
 *         description: Course created
 */
router.post('/', protect, educatorOnly, upload.single('courseThumbnail'), courseValidation, addCourse);

/**
 * @openapi
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               courseThumbnail: { type: string, format: binary }
 *               courseTitle: { type: string }
 *     responses:
 *       200:
 *         description: Course updated
 */
router.put('/:id', protect, educatorOnly, objectIdValidation, upload.single('courseThumbnail'), courseValidation, updateCourse);

/**
 * @openapi
 * /api/courses/{id}/duplicate:
 *   post:
 *     summary: Duplicate a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Course duplicated
 */
router.post('/:id/duplicate', protect, educatorOnly, objectIdValidation, duplicateCourse);

/**
 * @openapi
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course deleted
 *       403:
 *         description: Not authorized
 */
router.delete('/:id', protect, educatorOnly, objectIdValidation, deleteCourse);

/**
 * @openapi
 * /api/courses/{id}/rating:
 *   put:
 *     summary: Add or update a rating/review for a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               review: { type: string }
 *     responses:
 *       200:
 *         description: Rating added
 */
router.put('/:id/rating', protect, objectIdValidation, ratingValidation, addCourseRating);

/**
 * @openapi
 * /api/courses/{id}/rating:
 *   delete:
 *     summary: Delete a rating/review
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rating deleted
 */
router.delete('/:id/rating', protect, objectIdValidation, deleteCourseRating);

export default router;
