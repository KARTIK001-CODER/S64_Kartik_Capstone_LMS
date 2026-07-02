import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, ArrowRight, BookOpen, Award } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ProgressBar } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const API_BASE = 'http://localhost:5000';

const calculateTotalLectures = (course) => {
  if (!course?.courseContent) return 0;
  return course.courseContent.reduce((acc, chapter) => acc + (chapter.lectures || chapter.chapterContent || []).length, 0);
};

const MyEnrollments = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const { fetchUserEnrolledCourses } = useContext(AppContext);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/api/enrollments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          const mapped = data.map(enrollment => ({
            ...enrollment.courseId,
            progress: enrollment.progress?.length || 0,
            totalLectures: calculateTotalLectures(enrollment.courseId),
            lastWatchedChapterIndex: enrollment.lastWatchedChapterIndex,
            lastWatchedLectureIndex: enrollment.lastWatchedLectureIndex,
            courseCompleted: enrollment.courseCompleted || false,
          }));
          setEnrolledCourses(mapped);
        } else setEnrolledCourses([]);
      } catch (err) {
        setError(err.message || 'Failed to fetch enrolled courses');
        setEnrolledCourses([]);
      } finally { setIsLoading(false); }
    };
    fetchEnrolledCourses();
    fetchUserEnrolledCourses?.();
  }, [fetchUserEnrolledCourses]);

  const calculateCourseDuration = (course) => {
    if (!course?.courseContent) return 'N/A';
    let totalMinutes = 0;
    course.courseContent.forEach(chapter => {
      (chapter.chapterContent || chapter.lectures || []).forEach(lecture => {
        totalMinutes += (lecture.lectureDuration || lecture.duration || 0);
      });
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;
  };

  const calculateProgress = (course) => {
    if (!course?.progress || !course?.totalLectures) return 0;
    return (course.progress / course.totalLectures) * 100;
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <Skeleton variant="heading" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-4">
                <Skeleton variant="thumbnail" />
                <Skeleton variant="title" />
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState title="Failed to load enrollments" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Learning</h1>
            <p className="text-muted-foreground mt-1">Track your progress and continue learning</p>
          </div>
          <Button onClick={() => navigate('/courses-list')} variant="outline">
            <BookOpen size={16} />
            Explore Courses
          </Button>
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course, index) => (
              <div
                key={course._id || index}
                onClick={() => navigate(`/player/${course._id}`)}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer"
              >
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={imgErrors[course._id] ? defaultThumbnail : (course.courseThumbnail || defaultThumbnail)}
                    alt={course.courseTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={() => setImgErrors(prev => ({ ...prev, [course._id]: true }))}
                    loading="lazy"
                  />
                  <div className="absolute bottom-3 left-3">
                    {course.courseCompleted ? (
                      <Badge variant="success" size="sm">Completed</Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        {course.lastWatchedChapterIndex !== undefined ? 'Continue' : 'In Progress'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">
                    {course.courseTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{calculateCourseDuration(course)}</p>
                  <ProgressBar
                    value={calculateProgress(course)}
                    max={100}
                    size="sm"
                    showLabel
                    label="Progress"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No enrolled courses"
            description="Browse our catalog and enroll in your first course to get started."
            action={
              <Button onClick={() => navigate('/courses-list')}>
                Browse Courses <ArrowRight size={16} />
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default MyEnrollments;
