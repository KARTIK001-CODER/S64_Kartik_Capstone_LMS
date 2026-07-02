import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StudentsEnrolled = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

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
        setError(err.message || 'Failed to fetch data');
      } finally { setLoading(false); }
    };
    fetchCourses();
  }, []);

  const allEnrollments = courses.flatMap(course =>
    (course.enrolledStudents || []).map(studentId => ({
      courseTitle: course.courseTitle,
      courseId: course._id,
      studentId,
    }))
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton variant="heading" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <Skeleton variant="avatar" className="h-10 w-10" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="w-48" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load data" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Students Enrolled</h1>
        <p className="text-muted-foreground mt-1">View all students enrolled in your courses</p>
      </div>

      {courses.length > 0 ? (
        <Card variant="default" padding="none">
          <CardHeader className="px-6 py-4 border-b border-border">
            <CardTitle className="text-base">All Enrollments ({allEnrollments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {courses.map((course) => {
              const students = course.enrolledStudents || [];
              if (students.length === 0) return null;
              return (
                <div key={course._id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{course.courseTitle}</h3>
                    <Badge variant="neutral" size="sm">{students.length} enrolled</Badge>
                  </div>
                  <div className="space-y-2">
                    {students.map((studentId, idx) => (
                      <div key={`${course._id}-${idx}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                        <Avatar size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            Student {idx + 1}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">ID: {studentId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={Users} title="No enrollments yet" description="Students will appear here once they enroll in your courses." />
      )}
    </div>
  );
};

export default StudentsEnrolled;
