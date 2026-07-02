import { jest } from '@jest/globals';

const mockNotificationCreate = jest.fn();

jest.unstable_mockModule('../../models/Notification.js', () => ({
  default: {
    create: mockNotificationCreate,
  },
}));

const notificationService = await import('../notificationService.js');

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyEducatorNewEnrollment', () => {
    test('should create enrollment notification for educator', async () => {
      mockNotificationCreate.mockResolvedValue({ _id: 'n1' });

      const result = await notificationService.notifyEducatorNewEnrollment('e1', 'John', 'React 101', 'c1');

      expect(result._id).toBe('n1');
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        userId: 'e1',
        title: 'New Enrollment',
        message: 'John enrolled in "React 101"',
        type: 'enrollment',
        link: '/educator/courses/c1/students',
      });
    });
  });

  describe('notifyStudentEnrollment', () => {
    test('should create enrollment notification for student', async () => {
      mockNotificationCreate.mockResolvedValue({ _id: 'n2' });

      const result = await notificationService.notifyStudentEnrollment('s1', 'React 101', 'c1');

      expect(result._id).toBe('n2');
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        userId: 's1',
        title: 'Enrolled Successfully',
        message: 'You enrolled in "React 101"',
        type: 'enrollment',
        link: '/course/c1',
      });
    });
  });

  describe('notifyEducatorReviewReceived', () => {
    test('should create review notification for educator', async () => {
      mockNotificationCreate.mockResolvedValue({ _id: 'n3' });

      const result = await notificationService.notifyEducatorReviewReceived('e1', 'Jane', 'Node.js', 'c2');

      expect(result._id).toBe('n3');
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        userId: 'e1',
        title: 'New Review',
        message: 'Jane reviewed "Node.js"',
        type: 'review',
        link: '/educator/reviews',
      });
    });
  });

  describe('notifyStudentCourseCompleted', () => {
    test('should create completion notification for student', async () => {
      mockNotificationCreate.mockResolvedValue({ _id: 'n4' });

      const result = await notificationService.notifyStudentCourseCompleted('s1', 'React 101', 'c1');

      expect(result._id).toBe('n4');
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        userId: 's1',
        title: 'Course Completed',
        message: 'Congratulations! You completed "React 101"',
        type: 'completion',
        link: '/course/c1',
      });
    });
  });
});
