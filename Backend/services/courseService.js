import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { notifyEducatorReviewReceived } from './notificationService.js';

export const listCourses = async ({ page, limit, search, category, difficulty, language }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 12));
  const skip = (safePage - 1) * safeLimit;

  const filter = {};
  if (search) filter.courseTitle = { $regex: search, $options: 'i' };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (language) filter.language = language;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('courseTitle courseSubtitle courseThumbnail coursePrice educator courseRatings isPublished difficulty language category tags')
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

const parseJSONField = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

export const createCourse = async ({ educator, body, file }) => {
  let courseThumbnail = file?.path || body.courseThumbnail;

  const courseTitle = body.courseTitle;
  const courseSubtitle = body.courseSubtitle || '';
  const courseDescription = body.courseDescription;
  const coursePrice = body.coursePrice;
  const isPublished = body.isPublished;
  const discount = body.discount || 0;
  const category = body.category || 'General';
  const tags = parseJSONField(body.tags) || [];
  const difficulty = body.difficulty || 'All Levels';
  const language = body.language || 'English';
  const previewVideo = body.previewVideo || '';
  const learningOutcomes = parseJSONField(body.learningOutcomes) || [];
  const requirements = parseJSONField(body.requirements) || [];
  const courseContent = parseJSONField(body.courseContent) || [];

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
    courseSubtitle,
    courseDescription,
    coursePrice: Number(coursePrice),
    isPublished: Boolean(isPublished),
    discount: Number(discount),
    category,
    tags,
    difficulty,
    language,
    previewVideo,
    learningOutcomes,
    requirements,
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
  if (body.courseSubtitle !== undefined) updates.courseSubtitle = body.courseSubtitle;
  if (body.courseDescription !== undefined) updates.courseDescription = body.courseDescription;
  if (body.coursePrice !== undefined) updates.coursePrice = Number(body.coursePrice);
  if (body.isPublished !== undefined) updates.isPublished = Boolean(body.isPublished);
  if (body.discount !== undefined) updates.discount = Number(body.discount);
  if (body.category !== undefined) updates.category = body.category;
  if (body.tags !== undefined) updates.tags = parseJSONField(body.tags);
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
  if (body.language !== undefined) updates.language = body.language;
  if (body.previewVideo !== undefined) updates.previewVideo = body.previewVideo;
  if (body.learningOutcomes !== undefined) updates.learningOutcomes = parseJSONField(body.learningOutcomes);
  if (body.requirements !== undefined) updates.requirements = parseJSONField(body.requirements);
  if (body.courseContent) {
    updates.courseContent = parseJSONField(body.courseContent);
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

  try {
    const student = await User.findById(userId).select('name');
    if (student && course.educator) {
      notifyEducatorReviewReceived(course.educator, student.name, course.courseTitle, courseId).catch(() => {});
    }
  } catch (_) { /* notification failure should not block review */ }

  return course;
};

export const deleteRating = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const ratingIndex = course.courseRatings.findIndex(r => r.student.toString() === userId.toString());
  if (ratingIndex === -1) {
    const err = new Error('No rating found to delete');
    err.statusCode = 404;
    throw err;
  }

  course.courseRatings.splice(ratingIndex, 1);
  await course.save();
  return course;
};

export const addReviewReply = async (courseId, userId, ratingId, reply) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (course.educator.toString() !== userId.toString()) {
    const err = new Error('Not authorized to reply to reviews on this course');
    err.statusCode = 403;
    throw err;
  }

  const rating = course.courseRatings.id(ratingId);
  if (!rating) {
    const err = new Error('Review not found');
    err.statusCode = 404;
    throw err;
  }

  rating.reply = reply;
  rating.repliedAt = new Date();
  await course.save();
  return course;
};

export const duplicateCourse = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (course.educator.toString() !== userId.toString()) {
    const err = new Error('Not authorized to duplicate this course');
    err.statusCode = 403;
    throw err;
  }

  const courseObj = course.toObject();
  delete courseObj._id;
  delete courseObj.__v;
  delete courseObj.createdAt;
  delete courseObj.updatedAt;
  delete courseObj.enrolledStudents;
  delete courseObj.courseRatings;

  courseObj.courseTitle = `${courseObj.courseTitle} (Copy)`;
  courseObj.isPublished = false;

  return Course.create(courseObj);
};

export const listEducatorCourses = async (educatorId, { page, limit, search, status }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip = (safePage - 1) * safeLimit;
  const filter = { educator: educatorId };

  if (search) filter.courseTitle = { $regex: search, $options: 'i' };
  if (status === 'published') filter.isPublished = true;
  else if (status === 'draft') filter.isPublished = false;
  if (status === 'archived') filter.isArchived = true;
  else if (status && status !== 'all') {
    if (status === 'active') { filter.isArchived = false; }
  } else {
    filter.isArchived = { $ne: true };
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('courseTitle courseSubtitle courseThumbnail coursePrice educator courseRatings isPublished isArchived enrolledStudents difficulty language category tags')
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

export const bulkAction = async (educatorId, { courseIds, action }) => {
  const courses = await Course.find({ _id: { $in: courseIds }, educator: educatorId });

  if (courses.length !== courseIds.length) {
    const err = new Error('One or more courses not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  let update = {};
  if (action === 'publish') update = { isPublished: true, isArchived: false };
  else if (action === 'unpublish') update = { isPublished: false };
  else if (action === 'archive') update = { isArchived: true, isPublished: false };
  else if (action === 'unarchive') update = { isArchived: false };
  else if (action === 'delete') {
    await Course.deleteMany({ _id: { $in: courseIds }, educator: educatorId });
    return { message: `${courseIds.length} course(s) deleted` };
  } else {
    const err = new Error('Invalid action');
    err.statusCode = 400;
    throw err;
  }

  await Course.updateMany({ _id: { $in: courseIds }, educator: educatorId }, update);
  return { message: `${courseIds.length} course(s) ${action}ed` };
};
