import React, { useEffect, useState } from 'react';
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await axios.get(`${API_BASE}/api/courses/educator`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = response.data?.courses || response.data;
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch courses');
        setCourses([]);
      } finally { setLoading(false); }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load dashboard" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
  const totalEarnings = courses.reduce((sum, c) => sum + (c.coursePrice * (c.enrolledStudents?.length || 0)), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Educator Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your courses and performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="default" padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalEnrollments}</p>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10 text-warning">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Courses List */}
      <Card variant="default" padding="none">
        <CardHeader className="px-6 py-4 border-b border-border">
          <CardTitle className="text-base">All Courses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Enrollments</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course._id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-foreground">{course.courseTitle}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">${course.coursePrice?.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{course.enrolledStudents?.length || 0}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={course.isPublished ? 'success' : 'neutral'} size="sm">
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to get started." />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
