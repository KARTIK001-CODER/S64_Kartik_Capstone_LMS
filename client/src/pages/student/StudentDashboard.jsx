import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Award, TrendingUp, CheckCircle, Play, ArrowRight,
  BookMarked, BarChart3, BellRing, Star, Download, GraduationCap,
  Flame, Sparkles, Library, ChevronRight, Calendar
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { ProgressBar } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StudentDashboard = () => {
  const { user, notifications, unreadCount, markNotificationRead } = useContext(AppContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/certificates/my`, getAuthHeaders());
        setCertificates(res.data);
      } catch {
        setCertificates([]);
      } finally {
        setCertificatesLoading(false);
      }
    };
    fetchCertificates();
  }, [getAuthHeaders]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/api/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load dashboard data');
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleImageError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleDownloadCertificate = async (certificateId) => {
    setDownloadingId(certificateId);
    try {
      const response = await axios.get(
        `${API_BASE}/api/certificates/download/${certificateId}`,
        { ...getAuthHeaders(), responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState
          title="Failed to load dashboard"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const { continueLearning, statistics, recentActivity, recommendedCourses } = dashboardData || {};

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'enrolled': return <BookOpen size={16} className="text-primary" />;
      case 'lecture_completed': return <Play size={16} className="text-success" />;
      case 'course_completed': return <Award size={16} className="text-warning" />;
      default: return <CheckCircle size={16} className="text-muted-foreground" />;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'enrolled': return `Enrolled in ${activity.courseTitle}`;
      case 'lecture_completed': return activity.lectureTitle
        ? `Completed "${activity.lectureTitle}" in ${activity.courseTitle}`
        : `Completed a lecture in ${activity.courseTitle}`;
      case 'course_completed': return `Completed ${activity.courseTitle}`;
      default: return '';
    }
  };

  const calculateRating = (course) => {
    const ratings = course?.courseRatings || [];
    if (ratings.length === 0) return { avg: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { avg: (sum / ratings.length).toFixed(1), count: ratings.length };
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';

  const streakDays = statistics?.streakDays || 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'}
              </h1>
              {streakDays > 0 && (
                <Badge variant="warning" size="sm" className="gap-1">
                  <Flame size={12} />
                  {streakDays} day streak
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Here is your learning overview</p>
          </div>
          <Button onClick={() => navigate('/courses-list')} size="md">
            <BookMarked size={16} />
            Browse Courses
          </Button>
        </div>

        {/* Continue Learning Hero */}
        {continueLearning ? (
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 lg:w-80 relative overflow-hidden">
                <img
                  src={imgErrors[continueLearning.courseId] ? defaultThumbnail : (continueLearning.courseThumbnail || defaultThumbnail)}
                  alt={continueLearning.courseTitle}
                  className="w-full h-48 md:h-full object-cover"
                  loading="lazy"
                  onError={() => handleImageError(continueLearning.courseId)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />
              </div>
              <div className="flex-1 p-6 md:p-8">
                <Badge variant="default" size="sm" className="mb-3">
                  <Play size={10} />
                  Continue Learning
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">{continueLearning.courseTitle}</h2>
                {continueLearning.lastWatchedChapter && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {continueLearning.lastWatchedChapter}
                    {continueLearning.lastWatchedLecture ? ` - ${continueLearning.lastWatchedLecture}` : ''}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-4">by {continueLearning.educatorName}</p>

                <div className="max-w-md mb-4">
                  <ProgressBar
                    value={continueLearning.completedLectures}
                    max={continueLearning.totalLectures}
                    size="md"
                    showLabel
                    label={`${continueLearning.completedLectures} of ${continueLearning.totalLectures} lectures`}
                  />
                </div>

                <Button onClick={() => navigate(`/player/${continueLearning.courseId}`)}>
                  <Play size={16} fill="currentColor" />
                  Resume Learning
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-primary/5 via-primary/5 to-background">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Ready to start learning?</h2>
                <p className="text-sm text-muted-foreground">Browse our catalog and enroll in your first course.</p>
              </div>
              <Button onClick={() => navigate('/courses-list')}>
                Explore Courses
                <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              icon={<BookOpen size={20} />}
              label="Enrolled"
              value={statistics.coursesEnrolled}
            />
            <StatCard
              icon={<Award size={20} />}
              label="Completed"
              value={statistics.coursesCompleted}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Progress"
              value={`${statistics.overallProgress}%`}
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Hours"
              value={statistics.totalLearningHours}
            />
            <StatCard
              icon={<CheckCircle size={20} />}
              label="Certificates"
              value={statistics.certificatesEarned}
            />
          </div>
        )}

        {/* Two column: Activity + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card variant="default" padding="none" className="lg:col-span-2">
            <CardHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 size={18} className="text-primary" />
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-0">
                  {recentActivity.slice(0, 8).map((activity, idx) => (
                    <div
                      key={`${activity.type}-${activity.timestamp}-${idx}`}
                      onClick={() => { if (activity.courseId) navigate(`/player/${activity.courseId}`); }}
                      className="flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-accent transition cursor-pointer"
                    >
                      <div className="mt-0.5 p-2 rounded-full bg-muted flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{getActivityMessage(activity)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No activity yet"
                  description="Start learning to see your activity here"
                />
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card variant="default" padding="none">
            <CardHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellRing size={18} className="text-primary" />
                  Notifications
                </CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="error" size="sm">{unreadCount}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 6).map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => markNotificationRead(notification._id)}
                    className={`p-4 border-b border-border last:border-0 cursor-pointer transition hover:bg-accent ${
                      !notification.isRead ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${
                        !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(notification.createdAt)}</p>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={BellRing}
                  title="No notifications"
                  description="You are all caught up!"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Courses */}
        {recommendedCourses && recommendedCourses.length > 0 && (
          <Card variant="default" padding="none">
            <CardHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles size={18} className="text-warning" />
                  Recommended for You
                </CardTitle>
                <Button variant="ghost" size="xs" onClick={() => navigate('/courses-list')}>
                  View All
                  <ChevronRight size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedCourses.slice(0, 3).map((course) => {
                  const { avg, count } = calculateRating(course);
                  return (
                    <div
                      key={course._id}
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative h-36 overflow-hidden bg-muted">
                        <img
                          src={imgErrors[course._id] ? defaultThumbnail : (course.courseThumbnail || defaultThumbnail)}
                          alt={course.courseTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={() => handleImageError(course._id)}
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.courseTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {course.educator?.name || 'Instructor'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-warning text-warning" />
                            <span className="text-xs font-medium text-foreground">{avg}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            ${course.coursePrice || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates */}
        {!certificatesLoading && certificates.length > 0 && (
          <Card variant="default" padding="none">
            <CardHeader className="px-6 py-4 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award size={18} className="text-success" />
                Your Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.slice(0, 3).map((cert) => (
                  <div key={cert._id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-sm transition">
                    <div className="p-2.5 rounded-lg bg-success/10 flex-shrink-0">
                      <Award size={24} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">{cert.courseName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Completed {new Date(cert.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDownloadCertificate(cert.certificateId)}
                      disabled={downloadingId === cert.certificateId}
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => {
  return (
    <Card variant="default" padding="md" className="hover:shadow-md transition-shadow">
      <div className="p-2.5 rounded-lg bg-primary/10 text-primary inline-flex mb-3 w-fit">
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  );
};

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-muted/30">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="heading" />
          <Skeleton variant="text" className="w-48" />
        </div>
        <Skeleton variant="button" />
      </div>
      <Skeleton variant="card" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <Skeleton variant="avatar" className="h-10 w-10" />
            <Skeleton variant="heading" className="h-8 w-16" />
            <Skeleton variant="text" className="w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border p-6 space-y-4">
          <Skeleton variant="title" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="avatar" className="h-8 w-8" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <Skeleton variant="title" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default StudentDashboard;
