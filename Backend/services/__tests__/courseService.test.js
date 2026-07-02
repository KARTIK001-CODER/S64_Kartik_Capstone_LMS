import { jest } from '@jest/globals';

const mockCourseFind = jest.fn();
const mockCourseFindById = jest.fn();
const mockCourseCreate = jest.fn();
const mockCourseFindByIdAndUpdate = jest.fn();
const mockCountDocuments = jest.fn();

// Build a chainable Mongoose-like query that resolves via await
const makeQuery = (resolveValue) => {
  const then = (resolve) => resolve(resolveValue);
  const query = {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then, // makes the object awaitable
    catch: (cb) => cb,
  };
  return query;
};

jest.unstable_mockModule('../../models/Course.js', () => ({
  default: {
    find: mockCourseFind,
    findById: mockCourseFindById,
    create: mockCourseCreate,
    findByIdAndUpdate: mockCourseFindByIdAndUpdate,
    countDocuments: mockCountDocuments,
  },
}));

const courseService = await import('../courseService.js');

describe('courseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listCourses', () => {
    test('should return paginated courses with defaults', async () => {
      mockCourseFind.mockReturnValue(makeQuery([{ courseTitle: 'Test' }]));
      mockCountDocuments.mockResolvedValue(1);

      const result = await courseService.listCourses({});

      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
      expect(result.total).toBe(1);
      expect(result.courses).toHaveLength(1);
    });

    test('should apply search filter', async () => {
      mockCourseFind.mockReturnValue(makeQuery([]));
      mockCountDocuments.mockResolvedValue(0);

      await courseService.listCourses({ search: 'JS' });

      expect(mockCourseFind).toHaveBeenCalledWith({
        courseTitle: { $regex: 'JS', $options: 'i' },
      });
    });

    test('should apply category filter', async () => {
      mockCourseFind.mockReturnValue(makeQuery([]));
      mockCountDocuments.mockResolvedValue(0);

      await courseService.listCourses({ category: 'Web' });

      expect(mockCourseFind).toHaveBeenCalledWith({ category: 'Web' });
    });
  });

  describe('getCourseById', () => {
    test('should return course when found', async () => {
      mockCourseFindById.mockReturnValue(makeQuery({ _id: '123', courseTitle: 'Test' }));

      const result = await courseService.getCourseById('123');

      expect(result.courseTitle).toBe('Test');
    });

    test('should throw 404 when not found', async () => {
      mockCourseFindById.mockReturnValue(makeQuery(null));

      await expect(courseService.getCourseById('123'))
        .rejects.toThrow('Course not found');
    });
  });

  describe('deleteCourse', () => {
    test('should delete when user owns course', async () => {
      mockCourseFindById.mockResolvedValue({
        _id: '123',
        educator: 'user1',
        deleteOne: jest.fn().mockResolvedValue({}),
      });

      const result = await courseService.deleteCourse('123', 'user1');
      expect(result.message).toBe('Course removed');
    });

    test('should throw 403 when not owner', async () => {
      mockCourseFindById.mockResolvedValue({
        _id: '123',
        educator: 'owner1',
      });

      await expect(courseService.deleteCourse('123', 'other'))
        .rejects.toThrow('Not authorized');
    });
  });

  describe('addRating', () => {
    test('should add rating when enrolled and has not rated', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      mockCourseFindById.mockResolvedValue({
        enrolledStudents: ['student1'],
        courseRatings: [],
        save: mockSave,
      });

      await courseService.addRating('123', 'student1', 5, 'Great');
      expect(mockSave).toHaveBeenCalled();
    });

    test('should throw 403 when not enrolled', async () => {
      mockCourseFindById.mockResolvedValue({
        enrolledStudents: ['otherUser'],
        courseRatings: [],
      });

      await expect(courseService.addRating('123', 'student1', 4, ''))
        .rejects.toThrow('Must be enrolled');
    });
  });
});
