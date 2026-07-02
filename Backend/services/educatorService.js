import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import EducatorSettings from '../models/EducatorSettings.js';

export const getDashboardStats = async (educatorId) => {
  const courses = await Course.find({ educator: educatorId })
    .select('courseTitle courseThumbnail coursePrice isPublished enrolledStudents courseRatings createdAt')
    .populate('courseRatings.student', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const draftCourses = totalCourses - publishedCourses;

  const allStudentIds = new Set();
  let totalEnrollments = 0;
  let totalRatingSum = 0;
  let totalRatingCount = 0;

  for (const course of courses) {
    const students = course.enrolledStudents || [];
    for (const sid of students) {
      allStudentIds.add(sid.toString());
    }
    totalEnrollments += students.length;

    const ratings = course.courseRatings || [];
    for (const r of ratings) {
      totalRatingSum += r.rating;
      totalRatingCount++;
    }
  }

  const totalStudents = allStudentIds.size;
  const averageRating = totalRatingCount > 0
    ? Math.round((totalRatingSum / totalRatingCount) * 10) / 10
    : 0;

  const educatorCourseIds = courses.map(c => c._id);

  const enrollmentDocs = await Enrollment.find({
    courseId: { $in: educatorCourseIds },
    status: 'completed'
  })
    .select('courseCompleted courseCompletedAt enrolledAt courseId')
    .sort({ enrolledAt: -1 })
    .lean();

  const completedEnrollments = enrollmentDocs.filter(e => e.courseCompleted).length;
  const completionRate = enrollmentDocs.length > 0
    ? Math.round((completedEnrollments / enrollmentDocs.length) * 100)
    : 0;

  const monthlyEnrollments = buildMonthlyTrend(enrollmentDocs);

  const recentActivity = await buildRecentActivity(educatorId, courses, enrollmentDocs);

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalStudents,
    totalEnrollments,
    completionRate,
    averageRating,
    monthlyEnrollments,
    recentActivity,
  };
};

function buildMonthlyTrend(enrollments) {
  const monthMap = {};
  for (const e of enrollments) {
    const d = new Date(e.enrolledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  }

  const sorted = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([month, count]) => ({ month, count }));
}

async function buildRecentActivity(educatorId, courses, enrollments) {
  const activity = [];
  const now = Date.now();

  for (const course of courses) {
    activity.push({
      type: 'course_updated',
      message: `Course "${course.courseTitle}" was ${course.isPublished ? 'published' : 'saved as draft'}`,
      timestamp: course.createdAt,
    });
  }

  const recentEnrollments = enrollments.slice(0, 10);
  for (const e of recentEnrollments) {
    const course = courses.find(c => c._id.equals(e.courseId));
    if (course) {
      activity.push({
        type: 'enrollment',
        message: `New enrollment in "${course.courseTitle}"`,
        timestamp: e.enrolledAt,
      });

      if (e.courseCompleted && e.courseCompletedAt) {
        activity.push({
          type: 'completion',
          message: `Student completed "${course.courseTitle}"`,
          timestamp: e.courseCompletedAt,
        });
      }
    }
  }

  for (const course of courses) {
    const ratings = course.courseRatings || [];
    for (const r of ratings) {
      activity.push({
        type: 'review',
        message: `New ${r.rating}-star review on "${course.courseTitle}"`,
        timestamp: r.createdAt || now,
      });
    }
  }

  activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return activity.slice(0, 20).map(a => ({
    type: a.type,
    message: a.message,
    timestamp: a.timestamp,
  }));
};

export const getLearners = async (educatorId, { page, limit, search, courseId, status }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const educatorCourseIds = await Course.find({ educator: educatorId }).distinct('_id');

  if (educatorCourseIds.length === 0) {
    return { learners: [], total: 0, page: 1, pages: 1 };
  }

  const matchFilter = { courseId: { $in: educatorCourseIds }, status: 'completed' };
  if (courseId) matchFilter.courseId = courseId;
  if (status === 'completed') matchFilter.courseCompleted = true;
  else if (status === 'active') matchFilter.courseCompleted = { $ne: true };

  const pipeline = [
    { $match: matchFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        totalLectures: {
          $reduce: {
            input: { $ifNull: ['$course.courseContent', []] },
            initialValue: 0,
            in: { $add: ['$$value', { $size: { $ifNull: ['$$this.lectures', []] } }] }
          }
        },
        completedLectures: {
          $size: {
            $filter: {
              input: { $ifNull: ['$progress', []] },
              cond: '$$this.completed'
            }
          }
        }
      }
    },
    {
      $addFields: {
        progressPercent: {
          $cond: {
            if: { $gt: ['$totalLectures', 0] },
            then: { $round: [{ $multiply: [{ $divide: ['$completedLectures', '$totalLectures'] }, 100] }, 0] },
            else: 0
          }
        }
      }
    },
    {
      $project: {
        'student.password': 0,
        'student.__v': 0,
        'course.courseContent': 0,
        'course.__v': 0,
        'course.createdAt': 0,
        'course.updatedAt': 0,
        'course.enrolledStudents': 0,
        'course.courseRatings': 0,
        progress: 0,
        __v: 0
      }
    },
    { $sort: { enrolledAt: -1 } }
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'student.name': { $regex: search, $options: 'i' } },
          { 'student.email': { $regex: search, $options: 'i' } },
        ]
      }
    });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Enrollment.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  const learners = await Enrollment.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: safeLimit }
  ]);

  return {
    learners,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
};

export const getReportData = async (educatorId, startDate, endDate) => {
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.enrolledAt = {};
    if (startDate) dateFilter.enrolledAt.$gte = new Date(startDate);
    if (endDate) dateFilter.enrolledAt.$lte = new Date(endDate);
  }

  const courses = await Course.find({ educator: educatorId })
    .select('courseTitle coursePrice category enrolledStudents courseRatings')
    .lean();

  const educatorCourseIds = courses.map(c => c._id);

  if (educatorCourseIds.length === 0) {
    return {
      totalStudents: 0, totalCourses: 0, totalEnrollments: 0,
      totalRevenue: 0, growthRate: 0,
      enrollmentTrend: [], revenueTrend: [], courseDistribution: [],
      coursePerformance: [], recentActivity: [], completionTrend: [],
    };
  }

  const enrollments = await Enrollment.find({
    courseId: { $in: educatorCourseIds },
    status: 'completed',
    ...dateFilter
  })
    .select('studentId courseId amount enrolledAt courseCompleted courseCompletedAt')
    .lean();

  const allEnrollments = await Enrollment.find({
    courseId: { $in: educatorCourseIds },
    status: 'completed'
  })
    .select('studentId courseId amount enrolledAt courseCompleted courseCompletedAt')
    .lean();

  const uniqueStudents = new Set(enrollments.map(e => e.studentId.toString()));
  const totalStudents = uniqueStudents.size;
  const totalCourses = courses.length;
  const totalEnrollments = enrollments.length;
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount || 0), 0);

  const previousPeriodEnd = startDate ? new Date(startDate) : new Date();
  const previousPeriodStart = new Date(previousPeriodEnd);
  const rangeMs = endDate ? new Date(endDate) - previousPeriodEnd : 30 * 24 * 60 * 60 * 1000;
  previousPeriodStart.setTime(previousPeriodStart.getTime() - rangeMs);

  const prevEnrollments = allEnrollments.filter(e => {
    const d = new Date(e.enrolledAt);
    return d >= previousPeriodStart && d < previousPeriodEnd;
  });
  const growthRate = prevEnrollments.length > 0
    ? Math.round(((totalEnrollments - prevEnrollments.length) / prevEnrollments.length) * 100)
    : totalEnrollments > 0 ? 100 : 0;

  const monthMap = {};
  const revenueMap = {};
  for (const e of enrollments) {
    const d = new Date(e.enrolledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
    revenueMap[key] = (revenueMap[key] || 0) + (e.amount || 0);
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const enrollmentTrend = sortedMonths.map(m => ({ date: m, count: monthMap[m] }));
  const revenueTrend = sortedMonths.map(m => ({ date: m, revenue: revenueMap[m] || 0 }));

  const catMap = {};
  for (const c of courses) {
    const cat = c.category || 'General';
    catMap[cat] = (catMap[cat] || 0) + 1;
  }
  const courseDistribution = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  const completionTrend = buildMonthlyCompletionTrend(enrollments, courses);

  const coursePerformance = courses.map(c => {
    const courseEnrollments = enrollments.filter(e => e.courseId.toString() === c._id.toString());
    const completions = courseEnrollments.filter(e => e.courseCompleted).length;
    const ratings = c.courseRatings || [];
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : 0;
    return {
      courseId: c._id,
      courseTitle: c.courseTitle,
      enrollments: courseEnrollments.length,
      completions,
      completionRate: courseEnrollments.length > 0 ? Math.round((completions / courseEnrollments.length) * 100) : 0,
      revenue: courseEnrollments.reduce((s, e) => s + (e.amount || 0), 0),
      averageRating: avgRating,
    };
  }).sort((a, b) => b.enrollments - a.enrollments);

  const recentActivity = buildReportActivity(courses, enrollments);

  return {
    totalStudents,
    totalCourses,
    totalEnrollments,
    totalRevenue,
    growthRate,
    enrollmentTrend,
    revenueTrend,
    courseDistribution,
    coursePerformance,
    recentActivity,
    completionTrend,
  };
};

function buildMonthlyCompletionTrend(enrollments, courses) {
  const completed = enrollments.filter(e => e.courseCompleted && e.courseCompletedAt);
  const monthMap = {};
  for (const e of completed) {
    const d = new Date(e.courseCompletedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  }
  return Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
}

function buildReportActivity(courses, enrollments) {
  const activity = [];
  for (const e of enrollments.slice(0, 20)) {
    const course = courses.find(c => c._id.toString() === e.courseId.toString());
    if (course) {
      activity.push({
        type: 'enrollment',
        message: `Student enrolled in "${course.courseTitle}"`,
        timestamp: e.enrolledAt,
      });
      if (e.courseCompleted && e.courseCompletedAt) {
        activity.push({
          type: 'completion',
          message: `Student completed "${course.courseTitle}"`,
          timestamp: e.courseCompletedAt,
        });
      }
    }
  }
  return activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
};

export const getReviews = async (educatorId, { courseId, rating, page = 1, limit = 20 }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const match = { educator: educatorId };

  if (courseId) match._id = courseId;

  const courses = await Course.find(match)
    .select('courseTitle courseThumbnail courseRatings')
    .populate('courseRatings.student', 'name email avatar')
    .lean();

  let reviews = [];
  for (const course of courses) {
    for (const r of course.courseRatings) {
      reviews.push({
        _id: r._id,
        courseId: course._id,
        courseTitle: course.courseTitle,
        courseThumbnail: course.courseThumbnail,
        student: r.student,
        rating: r.rating,
        review: r.review,
        reply: r.reply,
        repliedAt: r.repliedAt,
        createdAt: r.createdAt,
      });
    }
  }

  if (rating) reviews = reviews.filter(r => r.rating === parseInt(rating));
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = reviews.length;
  const start = (safePage - 1) * safeLimit;
  const paginated = reviews.slice(start, start + safeLimit);

  return { reviews: paginated, total, page: safePage, pages: Math.ceil(total / safeLimit) };
};

export const getProfile = async (userId) => {
  return User.findById(userId).select('-password');
};

export const updateProfile = async (userId, updates) => {
  const allowed = ['name', 'headline', 'bio', 'experience', 'socialLinks', 'expertise', 'education'];
  const data = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) data[key] = updates[key];
  }
  if (updates.avatar) data.avatar = updates.avatar;

  const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true }).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const getSettings = async (educatorId) => {
  let settings = await EducatorSettings.findOne({ educator: educatorId });
  if (!settings) {
    settings = await EducatorSettings.create({ educator: educatorId });
  }
  return settings;
};

export const updateSettings = async (educatorId, updates) => {
  const allowed = ['defaults', 'visibility', 'certificate', 'enrollment'];
  const data = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) data[key] = updates[key];
  }
  const settings = await EducatorSettings.findOneAndUpdate(
    { educator: educatorId },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};
