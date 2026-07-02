import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { notifyStudentEnrollment, notifyStudentCourseCompleted, notifyEducatorNewEnrollment } from './notificationService.js';

export const listEnrolledCourses = async (studentId) => {
  return Enrollment.find({ studentId })
    .populate('courseId')
    .populate('studentId', 'name email');
};

export const enroll = async (studentId, courseId, { paymentId, orderId, amount }) => {
  const existing = await Enrollment.findOne({ studentId, courseId });
  if (existing) {
    const err = new Error('Already enrolled in this course');
    err.statusCode = 400;
    throw err;
  }

  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const enrollment = await Enrollment.create({
    studentId,
    courseId,
    paymentId: paymentId || 'temp_payment_id',
    orderId: orderId || 'temp_order_id',
    amount: amount || course.coursePrice,
    status: 'completed',
    progress: [],
  });

  course.enrolledStudents.push(studentId);
  await course.save();

  try {
    notifyStudentEnrollment(studentId, course.courseTitle, courseId).catch(() => {});
    const student = await User.findById(studentId).select('name');
    if (student && course.educator) {
      notifyEducatorNewEnrollment(course.educator, student.name, course.courseTitle, courseId).catch(() => {});
    }
  } catch (_) { /* notification failure should not block enrollment */ }

  return enrollment;
};

export const getProgress = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId });
  if (!enrollment) {
    const err = new Error('Not enrolled in this course');
    err.statusCode = 404;
    throw err;
  }
  return {
    progress: enrollment.progress,
    lastWatchedLectureId: enrollment.lastWatchedLectureId,
    lastWatchedChapterIndex: enrollment.lastWatchedChapterIndex,
    lastWatchedLectureIndex: enrollment.lastWatchedLectureIndex,
    courseCompleted: enrollment.courseCompleted,
    courseCompletedAt: enrollment.courseCompletedAt,
  };
};

export const updateProgress = async (studentId, courseId, lectureId) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId });
  if (!enrollment) {
    const err = new Error('Not enrolled in this course');
    err.statusCode = 404;
    throw err;
  }

  const progressIndex = enrollment.progress.findIndex(p => p.lectureId.toString() === lectureId);
  if (progressIndex === -1) {
    enrollment.progress.push({ lectureId, completed: true, completedAt: new Date() });
  } else {
    enrollment.progress[progressIndex].completed = true;
    enrollment.progress[progressIndex].completedAt = new Date();
  }

  const course = await Course.findById(courseId);
  if (course) {
    const totalLectures = course.courseContent?.reduce(
      (acc, ch) => acc + (ch.lectures || []).length, 0
    ) || 0;
    if (totalLectures > 0 && enrollment.progress.length >= totalLectures && !enrollment.courseCompleted) {
      enrollment.courseCompleted = true;
      enrollment.courseCompletedAt = new Date();
      notifyStudentCourseCompleted(studentId, course.courseTitle, courseId).catch(() => {});
    }
  }

  await enrollment.save();
  return enrollment;
};

export const updateLastWatched = async (studentId, courseId, { lectureId, chapterIndex, lectureIndex }) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId });
  if (!enrollment) {
    const err = new Error('Not enrolled in this course');
    err.statusCode = 404;
    throw err;
  }

  enrollment.lastWatchedLectureId = lectureId;
  enrollment.lastWatchedChapterIndex = chapterIndex;
  enrollment.lastWatchedLectureIndex = lectureIndex;
  await enrollment.save();

  return { success: true };
};
