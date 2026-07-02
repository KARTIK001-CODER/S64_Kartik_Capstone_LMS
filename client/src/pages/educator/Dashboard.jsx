import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, DollarSign, TrendingUp, Star,
  PlusCircle, BarChart3, ExternalLink, Clock, UserPlus,
  GraduationCap, MessageSquare, PenLine, FileText,
  ChevronRight, Layers, Target
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { api } = useAppContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/educator/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton variant="heading" className="w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-72" />
          <Skeleton variant="card" className="h-72" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load dashboard" description={error} onRetry={fetchStats} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <ErrorState title="No data available" description="Could not retrieve dashboard statistics." onRetry={fetchStats} />
      </div>
    );
  }

  const overviewCards = [
    {
      label: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-primary/10 text-primary',
      sub: `${stats.publishedCourses} published, ${stats.draftCourses} draft`,
    },
    {
      label: 'Published',
      value: stats.publishedCourses,
      icon: Layers,
      color: 'bg-success/10 text-success',
      sub: `${Math.round((stats.publishedCourses / (stats.totalCourses || 1)) * 100)}% of total`,
    },
    {
      label: 'Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-500',
      sub: `${stats.totalEnrollments} total enrollments`,
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: Target,
      color: 'bg-purple-500/10 text-purple-500',
      sub: 'across all courses',
    },
    {
      label: 'Average Rating',
      value: stats.averageRating > 0 ? stats.averageRating : '—',
      icon: Star,
      color: 'bg-warning/10 text-warning',
      sub: stats.averageRating > 0 ? `${stats.averageRating} / 5.0` : 'No ratings yet',
    },
    {
      label: 'Growth',
      value: stats.growthRate != null ? `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate}%` : '—',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-500',
      sub: 'enrollment growth this period',
    },
  ];

  const monthlyData = stats.monthlyEnrollments || [];
  const pieData = [
    { name: 'Published', value: stats.publishedCourses },
    { name: 'Draft', value: stats.draftCourses },
  ].filter(d => d.value > 0);

  const activityIcons = {
    enrollment: { icon: UserPlus, color: 'bg-primary/10 text-primary' },
    completion: { icon: GraduationCap, color: 'bg-success/10 text-success' },
    review: { icon: MessageSquare, color: 'bg-warning/10 text-warning' },
    course_updated: { icon: PenLine, color: 'bg-blue-500/10 text-blue-500' },
  };

  const formatTimestamp = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Educator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your courses and performance</p>
        </div>
        <Button onClick={() => navigate('/educator/add-course')}>
          <PlusCircle size={16} />
          Create Course
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} variant="default" padding="md" className="hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              {card.sub && (
                <p className="text-xs text-muted-foreground mt-2 truncate">{card.sub}</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Enrollments */}
        <Card variant="default" padding="md">
          <CardTitle as="h2" className="text-base mb-1">Monthly Enrollments</CardTitle>
          <p className="text-xs text-muted-foreground mb-4">Student enrollment trend over time</p>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                    formatter={(value) => [value, 'Enrollments']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <EmptyState icon={TrendingUp} title="No enrollment data" description="Enrollments will appear here once students join your courses." />
            </div>
          )}
        </Card>

        {/* Course Distribution */}
        <Card variant="default" padding="md">
          <CardTitle as="h2" className="text-base mb-1">Course Distribution</CardTitle>
          <p className="text-xs text-muted-foreground mb-4">Published vs Draft courses</p>
          {pieData.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to see distribution." />
            </div>
          )}
          {pieData.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row: Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardTitle as="h2" className="text-base mb-4">Recent Activity</CardTitle>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-1">
              {stats.recentActivity.slice(0, 10).map((activity, idx) => {
                const meta = activityIcons[activity.type] || activityIcons.course_updated;
                const Icon = meta.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-1.5 rounded-full ${meta.color} mt-0.5`}>
                      <Icon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState icon={Clock} title="No recent activity" description="Activity from your courses will appear here." />
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card variant="default" padding="md">
          <CardTitle as="h2" className="text-base mb-4">Quick Actions</CardTitle>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/educator/add-course')}
              aria-label="Create a new course"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <PlusCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Create Course</p>
                <p className="text-xs text-muted-foreground">Add a new course</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => navigate('/educator/my-courses')}
              aria-label="Manage your courses"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <BookOpen size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Manage Courses</p>
                <p className="text-xs text-muted-foreground">Edit, publish, or archive</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => navigate('/educator/student-enrolled')}
              aria-label="View enrolled students"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Users size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">View Students</p>
                <p className="text-xs text-muted-foreground">Track learner progress</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => navigate('/educator/reports')}
              aria-label="View analytics reports"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <BarChart3 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground">View detailed reports</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
