import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

export const listCourses = async ({ page, limit, search, category }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 12));
  const skip = (safePage - 1) * safeLimit;

  const filter = {};
  if (search) filter.courseTitle = { $regex: search, $options: 'i' };
  if (category) filter.category = category;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('courseTitle courseThumbnail coursePrice educator courseRatings isPublished')
      .populate('educator', 'name email')
      .populate('courseRatings.student', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Course.countDocuments(filter),
  ]);

  return { courses, total, page: safePage, pages: Math.ceil(total / safeLimit) };
};

export const getCourseById = async (courseId) => {
  const course = await Course.findById(courseId)
    .populate('educator', 'name email')
    .populate('courseRatings.student', 'name')
    .populate('enrolledStudents', 'name email');

  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }
  return course;
};

export const createCourse = async ({ educator, body, file }) => {
  let courseTitle, courseDescription, coursePrice, isPublished, discount, courseContent;
  let courseThumbnail = file?.path || body.courseThumbnail;

  if (file) {
    courseTitle = body.courseTitle;
    courseDescription = body.courseDescription;
    coursePrice = body.coursePrice;
    isPublished = body.isPublished;
    discount = body.discount;
    courseContent = body.courseContent ? JSON.parse(body.courseContent) : [];
  } else {
    courseTitle = body.courseTitle;
    courseDescription = body.courseDescription;
    coursePrice = body.coursePrice;
    isPublished = body.isPublished;
    discount = body.discount;
    courseContent = body.courseContent;
  }

  if (!courseTitle || !courseDescription || !coursePrice || !courseThumbnail) {
    const err = new Error('Missing required fields: title, description, price, and thumbnail are required');
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(courseContent) || courseContent.length === 0) {
    const err = new Error('Course content must be a non-empty array');
    err.statusCode = 400;
    throw err;
  }

  return Course.create({
    courseTitle,
    courseDescription,
    coursePrice: Number(coursePrice),
    isPublished: Boolean(isPublished),
    discount: Number(discount) || 0,
    courseContent,
    courseThumbnail,
    educator,
  });
};

export const updateCourse = async ({ courseId, userId, body, file }) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (course.educator.toString() !== userId.toString()) {
    const err = new Error('Not authorized to update this course');
    err.statusCode = 403;
    throw err;
  }

  const updates = {};
  if (file) updates.courseThumbnail = file.path;
  if (body.courseTitle !== undefined) updates.courseTitle = body.courseTitle;
  if (body.courseDescription !== undefined) updates.courseDescription = body.courseDescription;
  if (body.coursePrice !== undefined) updates.coursePrice = Number(body.coursePrice);
  if (body.isPublished !== undefined) updates.isPublished = Boolean(body.isPublished);
  if (body.discount !== undefined) updates.discount = Number(body.discount);
  if (body.courseContent) {
    updates.courseContent = typeof body.courseContent === 'string'
      ? JSON.parse(body.courseContent)
      : body.courseContent;
  }

  return Course.findByIdAndUpdate(courseId, updates, { new: true, runValidators: true })
    .populate('educator', 'name email')
    .populate('courseRatings.student', 'name');
};

export const deleteCourse = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (course.educator.toString() !== userId.toString()) {
    const err = new Error('Not authorized to delete this course');
    err.statusCode = 403;
    throw err;
  }

  await course.deleteOne();
  return { message: 'Course removed' };
};

export const addRating = async (courseId, userId, rating, review) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const isEnrolled = course.enrolledStudents.some(s => s.toString() === userId.toString());
  if (!isEnrolled) {
    const err = new Error('Must be enrolled to rate this course');
    err.statusCode = 403;
    throw err;
  }

  const existingRating = course.courseRatings.find(r => r.student.toString() === userId.toString());
  if (existingRating) {
    existingRating.rating = rating;
    existingRating.review = review;
  } else {
    course.courseRatings.push({ student: userId, rating, review });
  }

  await course.save();
  return course;
};

export const listEducatorCourses = async (educatorId, { page, limit }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip = (safePage - 1) * safeLimit;
  const filter = { educator: educatorId };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('courseTitle courseThumbnail coursePrice educator courseRatings isPublished enrolledStudents')
      .populate('educator', 'name email')
      .populate('courseRatings.student', 'name')
      .populate('enrolledStudents', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Course.countDocuments(filter),
  ]);

  return { courses, total, page: safePage, pages: Math.ceil(total / safeLimit) };
};
