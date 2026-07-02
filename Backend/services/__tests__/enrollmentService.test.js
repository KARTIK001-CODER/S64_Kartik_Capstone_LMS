import { jest } from '@jest/globals';

const mockEnrollmentFind = jest.fn();
const mockEnrollmentFindOne = jest.fn();
const mockEnrollmentCreate = jest.fn();
const mockCourseFindById = jest.fn();

const makeQuery = (resolveValue) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: (resolve) => resolve(resolveValue),
  catch: (cb) => cb,
});

jest.unstable_mockModule('../../models/Enrollment.js', () => ({
  default: {
    find: mockEnrollmentFind,
    findOne: mockEnrollmentFindOne,
    create: mockEnrollmentCreate,
  },
}));

jest.unstable_mockModule('../../models/Course.js', () => ({
  default: {
    findById: mockCourseFindById,
  },
}));

const enrollmentService = await import('../enrollmentService.js');

describe('enrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listEnrolledCourses', () => {
    test('should return enrollments for a student', async () => {
      mockEnrollmentFind.mockReturnValue(
        makeQuery([{ studentId: 's1', courseId: { courseTitle: 'Test' } }])
      );

      const result = await enrollmentService.listEnrolledCourses('student1');

      expect(result).toHaveLength(1);
      expect(mockEnrollmentFind).toHaveBeenCalledWith({ studentId: 'student1' });
    });
  });

  describe('enroll', () => {
    test('should create enrollment when not already enrolled', async () => {
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockCourseFindById.mockResolvedValue({
        coursePrice: 100,
        enrolledStudents: [],
        save: jest.fn(),
      });
      mockEnrollmentCreate.mockResolvedValue({
        studentId: 's1',
        courseId: 'c1',
        status: 'completed',
      });

      const result = await enrollmentService.enroll('s1', 'c1', {
        paymentId: 'pay1', orderId: 'ord1', amount: 100,
      });

      expect(result.status).toBe('completed');
      expect(mockEnrollmentCreate).toHaveBeenCalled();
    });

    test('should throw 400 when already enrolled', async () => {
      mockEnrollmentFindOne.mockResolvedValue({ _id: 'existing' });

      await expect(enrollmentService.enroll('s1', 'c1', {}))
        .rejects.toThrow('Already enrolled');
    });

    test('should throw 404 when course not found', async () => {
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockCourseFindById.mockResolvedValue(null);

      await expect(enrollmentService.enroll('s1', 'c1', {}))
        .rejects.toThrow('Course not found');
    });
  });

  describe('getProgress', () => {
    test('should return progress when enrolled', async () => {
      mockEnrollmentFindOne.mockResolvedValue({
        progress: [{ lectureId: 'l1', completed: true }],
      });

      const result = await enrollmentService.getProgress('s1', 'c1');

      expect(result.progress).toHaveLength(1);
    });

    test('should throw 404 when not enrolled', async () => {
      mockEnrollmentFindOne.mockResolvedValue(null);

      await expect(enrollmentService.getProgress('s1', 'c1'))
        .rejects.toThrow('Not enrolled');
    });
  });

  describe('updateProgress', () => {
    test('should add new lecture progress', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      mockEnrollmentFindOne.mockResolvedValue({ progress: [], save: mockSave });

      const result = await enrollmentService.updateProgress('s1', 'c1', 'l1');

      expect(mockSave).toHaveBeenCalled();
    });

    test('should throw 404 when not enrolled', async () => {
      mockEnrollmentFindOne.mockResolvedValue(null);

      await expect(enrollmentService.updateProgress('s1', 'c1', 'l1'))
        .rejects.toThrow('Not enrolled');
    });
  });
});
