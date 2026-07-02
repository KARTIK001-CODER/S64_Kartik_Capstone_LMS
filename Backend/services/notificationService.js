import Notification from '../models/Notification.js';

const create = async (userId, { title, message, type = 'system', link = null }) => {
  return Notification.create({ userId, title, message, type, link });
};

export const notifyEducatorNewEnrollment = async (educatorId, studentName, courseTitle, courseId) => {
  return create(educatorId, {
    title: 'New Enrollment',
    message: `${studentName} enrolled in "${courseTitle}"`,
    type: 'enrollment',
    link: `/educator/courses/${courseId}/students`,
  });
};

export const notifyStudentEnrollment = async (studentId, courseTitle, courseId) => {
  return create(studentId, {
    title: 'Enrolled Successfully',
    message: `You enrolled in "${courseTitle}"`,
    type: 'enrollment',
    link: `/course/${courseId}`,
  });
};

export const notifyEducatorReviewReceived = async (educatorId, studentName, courseTitle, courseId) => {
  return create(educatorId, {
    title: 'New Review',
    message: `${studentName} reviewed "${courseTitle}"`,
    type: 'review',
    link: `/educator/reviews`,
  });
};

export const notifyStudentCourseCompleted = async (studentId, courseTitle, courseId) => {
  return create(studentId, {
    title: 'Course Completed',
    message: `Congratulations! You completed "${courseTitle}"`,
    type: 'completion',
    link: `/course/${courseId}`,
  });
};
