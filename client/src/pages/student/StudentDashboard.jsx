import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Award, TrendingUp, CheckCircle, Play, ArrowRight, BookMarked, BarChart3, BellRing, Star, Download } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

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
      console.error('Failed to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
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
      case 'enrolled': return <BookOpen size={16} className="text-blue-500" />;
      case 'lecture_completed': return <Play size={16} className="text-green-500" />;
      case 'course_completed': return <Award size={16} className="text-yellow-500" />;
      default: return <CheckCircle size={16} className="text-gray-400" />;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'enrolled':
        return `Enrolled in ${activity.courseTitle}`;
      case 'lecture_completed':
        return activity.lectureTitle
          ? `Completed "${activity.lectureTitle}" in ${activity.courseTitle}`
          : `Completed a lecture in ${activity.courseTitle}`;
      case 'course_completed':
        return `Completed ${activity.courseTitle}`;
      default:
        return '';
    }
  };

  const calculateRating = (course) => {
    const ratings = course?.courseRatings || [];
    if (ratings.length === 0) return { avg: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { avg: (sum / ratings.length).toFixed(1), count: ratings.length };
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-gray-500 mt-1">Here's your learning overview</p>
          </div>
          <button
            onClick={() => navigate('/courses-list')}
            className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <BookMarked size={18} />
            Browse Courses
          </button>
        </div>

        {/* Continue Learning */}
        {continueLearning ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row items-stretch">
              <div className="md:w-72 lg:w-80 relative overflow-hidden">
                <img
                  src={imgErrors[continueLearning.courseId] ? defaultThumbnail : (continueLearning.courseThumbnail || defaultThumbnail)}
                  alt={continueLearning.courseTitle}
                  className="w-full h-48 md:h-full object-cover"
                  onError={() => handleImageError(continueLearning.courseId)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r md:from-black/20 md:to-transparent" />
              </div>
              <div className="flex-1 p-6 md:p-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                    Continue Learning
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">{continueLearning.courseTitle}</h2>
                {continueLearning.lastWatchedChapter && (
                  <p className="text-blue-100 text-sm mb-1">
                    {continueLearning.lastWatchedChapter}
                    {continueLearning.lastWatchedLecture ? ` - ${continueLearning.lastWatchedLecture}` : ''}
                  </p>
                )}
                <p className="text-blue-200 text-sm mb-4">by {continueLearning.educatorName}</p>

                <div className="max-w-md mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{continueLearning.completedLectures} of {continueLearning.totalLectures} lectures</span>
                    <span className="font-semibold">{continueLearning.progress}%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{ width: `${continueLearning.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/player/${continueLearning.courseId}`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition shadow-md"
                >
                  <Play size={18} fill="currentColor" />
                  Resume Learning
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="p-8 md:p-10 text-white text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Ready to start learning?</h2>
              <p className="text-gray-300 mb-4">Browse our course catalog and enroll in your first course.</p>
              <button
                onClick={() => navigate('/courses-list')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                Explore Courses
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={<BookOpen size={22} />}
              label="Enrolled"
              value={statistics.coursesEnrolled}
              color="blue"
            />
            <StatCard
              icon={<Award size={22} />}
              label="Completed"
              value={statistics.coursesCompleted}
              color="green"
            />
            <StatCard
              icon={<TrendingUp size={22} />}
              label="Progress"
              value={`${statistics.overallProgress}%`}
              color="purple"
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Hours"
              value={statistics.totalLearningHours}
              color="orange"
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              label="Certificates"
              value={statistics.certificatesEarned}
              color="teal"
            />
          </div>
        )}

        {/* Main grid: Activity + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-500" />
                Recent Activity
              </h3>
            </div>
            <div className="p-4">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-0">
                  {recentActivity.slice(0, 8).map((activity, idx) => (
                    <div
                      key={`${activity.type}-${activity.timestamp}-${idx}`}
                      className="flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => {
                        if (activity.courseId) navigate(`/player/${activity.courseId}`);
                      }}
                    >
                      <div className="mt-0.5 p-2 bg-gray-100 rounded-full flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">
                          {getActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
                  <p>No activity yet</p>
                  <p className="text-xs mt-1">Start learning to see your activity here</p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BellRing size={20} className="text-blue-500" />
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 6).map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => markNotificationRead(notification._id)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-blue-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <BellRing size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Courses */}
        {recommendedCourses && recommendedCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star size={20} className="text-yellow-500" />
                Recommended for You
              </h3>
              <button
                onClick={() => navigate('/courses-list')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedCourses.map((course) => {
                const { avg, count } = calculateRating(course);
                return (
                  <div
                    key={course._id}
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={imgErrors[course._id] ? defaultThumbnail : (course.courseThumbnail || defaultThumbnail)}
                        alt={course.courseTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={() => handleImageError(course._id)}
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                        {course.courseTitle}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">
                        {course.educator?.name || 'Instructor'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-xs">★</span>
                          <span className="text-xs font-medium text-gray-700">{avg}</span>
                          <span className="text-xs text-gray-400">({count})</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(course.coursePrice || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certificates */}
        {!certificatesLoading && certificates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award size={20} className="text-green-500" />
                Your Certificates
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Award size={24} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                          {cert.courseName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Completed {new Date(cert.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadCertificate(cert.certificateId)}
                      disabled={downloadingId === cert.certificateId}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <Download size={16} />
                      {downloadingId === cert.certificateId ? 'Downloading...' : 'Download Certificate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
      <div className={`p-2.5 rounded-lg inline-flex mb-3 ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};

export default StudentDashboard;
