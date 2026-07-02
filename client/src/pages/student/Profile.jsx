import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, TrendingUp, Clock, CheckCircle, Mail, Calendar, Download, User as UserIcon } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const res = await axios.get(`${API_BASE}/api/student/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleDownloadCertificate = async (certificateId) => {
    setDownloadingId(certificateId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/certificates/download/${certificateId}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to load profile</h2>
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

  const { user, statistics, certificates } = profileData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserIcon size={14} />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Joined {new Date(user?.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
            >
              My Dashboard
            </button>
          </div>
        </div>

        {/* Learning Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard icon={<BookOpen size={22} />} label="Enrolled" value={statistics.coursesEnrolled} color="blue" />
            <StatCard icon={<Award size={22} />} label="Completed" value={statistics.coursesCompleted} color="green" />
            <StatCard icon={<TrendingUp size={22} />} label="Progress" value={`${statistics.overallProgress}%`} color="purple" />
            <StatCard icon={<Clock size={22} />} label="Hours" value={statistics.totalLearningHours} color="orange" />
            <StatCard icon={<CheckCircle size={22} />} label="Certificates" value={statistics.certificatesEarned} color="teal" />
          </div>
        )}

        {/* Certificates */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Certificates</h2>
          {certificates && certificates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition">
                  <div className="p-3 bg-green-50 rounded-lg flex-shrink-0">
                    <Award size={28} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{cert.courseName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Completed {new Date(cert.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <button
                      onClick={() => handleDownloadCertificate(cert.certificateId)}
                      disabled={downloadingId === cert.certificateId}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition disabled:opacity-50"
                    >
                      <Download size={14} />
                      {downloadingId === cert.certificateId ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Award size={48} className="mx-auto mb-2 opacity-30" />
              <p>No certificates yet</p>
              <p className="text-xs mt-1">Complete a course to earn your first certificate</p>
            </div>
          )}
        </div>
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

export default Profile;
