import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, TrendingUp, Clock, CheckCircle, Mail, Calendar, Download, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

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
      } finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleDownloadCertificate = async (certificateId) => {
    setDownloadingId(certificateId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/certificates/download/${certificateId}`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setDownloadingId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          <div className="flex items-center gap-6">
            <Skeleton variant="avatar" className="h-20 w-20" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="heading" />
              <Skeleton variant="text" className="w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <Skeleton variant="avatar" className="h-10 w-10" />
                <Skeleton variant="heading" className="h-8 w-12" />
                <Skeleton variant="text" className="w-16" />
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
        <ErrorState title="Failed to load profile" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const { user, statistics, certificates } = profileData || {};

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Header */}
        <Card variant="default" padding="lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar
              size="2xl"
              src={user?.avatar}
              alt={user?.name}
              initials={user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {user?.email}</span>
                <span className="flex items-center gap-1.5"><Award size={14} /> {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(user?.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={14} />
              Dashboard
            </Button>
          </div>
        </Card>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={<BookOpen size={20} />} label="Enrolled" value={statistics.coursesEnrolled} />
            <StatCard icon={<Award size={20} />} label="Completed" value={statistics.coursesCompleted} />
            <StatCard icon={<TrendingUp size={20} />} label="Progress" value={`${statistics.overallProgress}%`} />
            <StatCard icon={<Clock size={20} />} label="Hours" value={statistics.totalLearningHours} />
            <StatCard icon={<CheckCircle size={20} />} label="Certificates" value={statistics.certificatesEarned} />
          </div>
        )}

        {/* Certificates */}
        <Card variant="default" padding="lg">
          <CardTitle className="text-lg font-semibold text-foreground mb-4">Certificates</CardTitle>
          {certificates && certificates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert._id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-sm transition">
                  <div className="p-3 rounded-lg bg-success/10 flex-shrink-0">
                    <Award size={24} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{cert.courseName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Completed {new Date(cert.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <button
                      onClick={() => handleDownloadCertificate(cert.certificateId)}
                      disabled={downloadingId === cert.certificateId}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-success hover:text-success/80 transition disabled:opacity-50"
                    >
                      <Download size={12} />
                      {downloadingId === cert.certificateId ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Award} title="No certificates yet" description="Complete a course to earn your first certificate" />
          )}
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <Card variant="default" padding="md" className="hover:shadow-md transition-shadow">
    <div className="p-2.5 rounded-lg bg-primary/10 text-primary inline-flex mb-3 w-fit">{icon}</div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </Card>
);

export default Profile;
