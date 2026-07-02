import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Edit3, Trash2, Eye, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';
import { Avatar } from '../../components/ui/avatar';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/courses/educator');
      const data = response.data?.courses || response.data;
      setCourses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
      setCourses([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setDeleting(courseId);
    try {
      await api.delete(`/api/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c._id !== courseId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    } finally { setDeleting(null); }
  };

  const handleTogglePublish = async (course) => {
    try {
      const res = await api.put(`/api/courses/${course._id}`, {
        ...course,
        isPublished: !course.isPublished,
        courseContent: undefined
      });
      setCourses(prev => prev.map(c => c._id === course._id ? { ...c, isPublished: res.data?.isPublished ?? !course.isPublished } : c));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update course');
    }
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton variant="heading" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-4">
              <Skeleton variant="thumbnail" />
              <Skeleton variant="title" />
              <Skeleton variant="text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load courses" description={error} onRetry={fetchCourses} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your course catalog</p>
        </div>
        <Button onClick={() => navigate('/educator/add-course')}>
          <PlusCircle size={16} />
          Add Course
        </Button>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const enrolledCount = course.enrolledStudents?.length || 0;
            return (
              <Card key={course._id} variant="default" padding="none" className="overflow-hidden">
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={imgErrors[course._id] ? defaultThumbnail : (course.courseThumbnail || defaultThumbnail)}
                    alt={course.courseTitle}
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors(prev => ({ ...prev, [course._id]: true }))}
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={course.isPublished ? 'success' : 'neutral'} size="sm">
                      {course.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">
                    {course.courseTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    ${course.coursePrice?.toFixed(2)} &bull; {enrolledCount} student{enrolledCount !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/educator/edit-course/${course._id}`)}>
                      <Edit3 size={14} />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleTogglePublish(course)}>
                      <Eye size={14} />
                      {course.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(course._id)}
                      loading={deleting === course._id}
                      className="text-muted-foreground hover:text-error"
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/courses/${course._id}`, '_blank')}>
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start teaching."
          action={
            <Button onClick={() => navigate('/educator/add-course')}>
              <PlusCircle size={16} />
              Create Course
            </Button>
          }
        />
      )}
    </div>
  );
};

export default MyCourses;
