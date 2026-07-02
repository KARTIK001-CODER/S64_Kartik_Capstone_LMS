import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

export const getDashboardData = async (studentId) => {
  const enrollments = await Enrollment.find({ studentId })
    .populate({
      path: 'courseId',
      select: 'courseTitle courseThumbnail coursePrice educator courseRatings isPublished category courseContent createdAt',
      populate: { path: 'educator', select: 'name email' }
    })
    .sort({ enrolledAt: -1 });

  const continueLearning = buildContinueLearning(enrollments);
  const statistics = buildStatistics(enrollments);
  const recentActivity = buildRecentActivity(enrollments);
  const recommendedCourses = await buildRecommendations(enrollments);

  return { continueLearning, statistics, recentActivity, recommendedCourses };
};

function buildContinueLearning(enrollments) {
  const target = enrollments.find(e => e.lastWatchedLectureId && !e.courseCompleted);
  if (!target) return null;

  const course = target.courseId;
  if (!course) return null;

  const totalLectures = course.courseContent?.reduce(
    (acc, ch) => acc + (ch.lectures || []).length, 0
  ) || 0;

  const completedCount = target.progress.filter(p => p.completed).length;
  const progress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  let lastWatchedLecture = null;
  let lastWatchedChapter = null;
  if (target.lastWatchedChapterIndex != null && target.lastWatchedLectureIndex != null) {
    const chapter = course.courseContent?.[target.lastWatchedChapterIndex];
    const lecture = chapter?.lectures?.[target.lastWatchedLectureIndex];
    if (lecture) {
      lastWatchedLecture = lecture.title;
      lastWatchedChapter = chapter.title;
    }
  }

  return {
    courseId: course._id,
    courseTitle: course.courseTitle,
    courseThumbnail: course.courseThumbnail,
    educatorName: course.educator?.name || '',
    progress,
    completedLectures: completedCount,
    totalLectures,
    lastWatchedLecture,
    lastWatchedChapter,
  };
}

function buildStatistics(enrollments) {
  let totalLecturesAcrossAll = 0;
  let totalCompletedLectures = 0;
  let totalLearningMinutes = 0;

  for (const enrollment of enrollments) {
    const course = enrollment.courseId;
    if (!course?.courseContent) continue;

    const courseTotal = course.courseContent.reduce(
      (acc, ch) => acc + (ch.lectures || []).length, 0
    );
    totalLecturesAcrossAll += courseTotal;

    const completedInCourse = enrollment.progress.filter(p => p.completed);
    totalCompletedLectures += completedInCourse.length;

    for (const progressItem of completedInCourse) {
      for (const chapter of course.courseContent) {
        const lecture = (chapter.lectures || []).find(
          l => l._id.toString() === progressItem.lectureId.toString()
        );
        if (lecture) {
          totalLearningMinutes += lecture.duration || 0;
          break;
        }
      }
    }
  }

  const coursesCompleted = enrollments.filter(e => e.courseCompleted).length;
  const overallProgress = totalLecturesAcrossAll > 0
    ? Math.round((totalCompletedLectures / totalLecturesAcrossAll) * 100)
    : 0;

  return {
    coursesEnrolled: enrollments.length,
    coursesCompleted,
    overallProgress,
    totalLearningHours: Math.round((totalLearningMinutes / 60) * 10) / 10,
    certificatesEarned: coursesCompleted,
  };
}

function buildRecentActivity(enrollments) {
  const activities = [];

  for (const enrollment of enrollments) {
    const course = enrollment.courseId;
    if (!course) continue;

    activities.push({
      type: 'enrolled',
      courseTitle: course.courseTitle,
      courseId: course._id,
      timestamp: enrollment.enrolledAt,
    });

    for (const progressItem of enrollment.progress) {
      if (progressItem.completed && progressItem.completedAt) {
        let lectureTitle = null;
        for (const chapter of (course.courseContent || [])) {
          const lecture = (chapter.lectures || []).find(
            l => l._id.toString() === progressItem.lectureId.toString()
          );
          if (lecture) {
            lectureTitle = lecture.title;
            break;
          }
        }
        activities.push({
          type: 'lecture_completed',
          courseTitle: course.courseTitle,
          courseId: course._id,
          lectureTitle,
          timestamp: progressItem.completedAt,
        });
      }
    }

    if (enrollment.courseCompleted && enrollment.courseCompletedAt) {
      activities.push({
        type: 'course_completed',
        courseTitle: course.courseTitle,
        courseId: course._id,
        timestamp: enrollment.courseCompletedAt,
      });
    }
  }

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, 10);
}

async function buildRecommendations(enrollments) {
  const enrolledCourseIds = [];
  const enrolledCategories = new Set();

  for (const enrollment of enrollments) {
    const course = enrollment.courseId;
    if (!course) continue;
    enrolledCourseIds.push(course._id);
    if (course.category) enrolledCategories.add(course.category);
  }

  const filter = {
    _id: { $nin: enrolledCourseIds },
    isPublished: true,
  };

  if (enrolledCategories.size > 0) {
    filter.category = { $in: [...enrolledCategories] };
  }

  return Course.find(filter)
    .select('courseTitle courseThumbnail coursePrice educator courseRatings category enrolledStudents')
    .populate('educator', 'name email')
    .sort({ enrolledStudents: -1, createdAt: -1 })
    .limit(6);
}
