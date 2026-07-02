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
  addCourseRating
} from '../controllers/courseController.js';

const router = express.Router();

/**
 * @openapi
 * /api/courses:
 *   get:
 *     summary: List all published courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Items per page (max 50)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by course title
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Paginated list of courses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCourses'
 */
router.get('/', getCourses);

/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get('/:id', getCourseById);

/**
 * @openapi
 * /api/courses/educator:
 *   get:
 *     summary: Get educator's own courses (paginated)
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
 *         description: Paginated educator courses
 */
router.get('/educator', protect, educatorOnly, getEducatorCourses);

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
 *             required: [courseTitle, courseDescription, coursePrice, courseThumbnail, courseContent]
 *             properties:
 *               courseTitle: { type: string }
 *               courseDescription: { type: string }
 *               coursePrice: { type: number }
 *               courseThumbnail: { type: string, format: binary }
 *               courseContent: { type: string, description: "JSON string of chapters array" }
 *               isPublished: { type: boolean }
 *               discount: { type: number }
 *     responses:
 *       201:
 *         description: Created course
 */
router.post('/', protect, educatorOnly, upload.single('courseThumbnail'), addCourse);

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
 *               courseTitle: { type: string }
 *               courseDescription: { type: string }
 *               coursePrice: { type: number }
 *               courseThumbnail: { type: string, format: binary }
 *               courseContent: { type: string, description: "JSON string of chapters array" }
 *               isPublished: { type: boolean }
 *               discount: { type: number }
 *     responses:
 *       200:
 *         description: Updated course
 *       404:
 *         description: Course not found
 */
router.put('/:id', protect, educatorOnly, upload.single('courseThumbnail'), updateCourse);

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
 *         description: Course removed
 *       404:
 *         description: Course not found
 */
router.delete('/:id', protect, educatorOnly, deleteCourse);

/**
 * @openapi
 * /api/courses/{id}/rating:
 *   put:
 *     summary: Rate a course (must be enrolled)
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
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               review: { type: string }
 *     responses:
 *       200:
 *         description: Updated course with new rating
 *       403:
 *         description: Must be enrolled to rate
 */
router.put('/:id/rating', protect, addCourseRating);

export default router;
