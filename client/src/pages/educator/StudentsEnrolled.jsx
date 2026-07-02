import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Search, Download, ChevronLeft, ChevronRight, GraduationCap, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { ProgressBar } from '../../components/ui/progress';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const STATUS_OPTIONS = [
  { value: '', label: 'All Learners' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const StudentsEnrolled = () => {
  const { courseId } = useParams();
  const { api } = useAppContext();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState(courseId || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/api/courses/educator');
        const c = res.data?.courses || res.data || [];
        setCourses(Array.isArray(c) ? c : []);
      } catch { /* ignore */ }
    };
    fetchCourses();
  }, [api]);

  const fetchLearners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (courseFilter) params.set('courseId', courseFilter);

      const res = await api.get(`/api/educator/learners?${params}`);
      setData(res.data);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load learners');
    } finally { setLoading(false); }
  }, [api, page, search, statusFilter, courseFilter]);

  useEffect(() => { fetchLearners(); }, [fetchLearners]);
  useEffect(() => { setPage(1); }, [search, statusFilter, courseFilter]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (courseFilter) params.set('courseId', courseFilter);

      const res = await api.get(`/api/educator/learners/export/csv?${params}`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'learners_report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally { setExporting(false); }
  };

  const courseOptions = [
    { value: '', label: 'All Courses' },
    ...courses.map(c => ({ value: c._id, label: c.courseTitle })),
  ];

  const totalLearners = data?.total || 0;
  const learners = data?.learners || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learners</h1>
          <p className="text-muted-foreground mt-1">{totalLearners} student{totalLearners !== 1 ? 's' : ''} enrolled</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} loading={exporting}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="w-44">
          <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} options={courseOptions} />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <Skeleton variant="avatar" className="h-10 w-10" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="w-48" />
                <Skeleton variant="text" className="w-32" />
              </div>
              <Skeleton variant="text" className="w-24" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load learners" description={error} onRetry={fetchLearners} />
      ) : learners.length > 0 ? (
        <>
          <Card variant="default" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Course</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Enrolled</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Progress</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {learners.map((learner, idx) => {
                    const student = learner.student || {};
                    const course = learner.course || {};
                    const progress = learner.progressPercent || 0;
                    return (
                      <tr key={learner._id || idx} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" src={student.avatar} alt={student.name} initials={student.name?.charAt(0)} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{student.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate">{student.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          <p className="truncate max-w-48">{course.courseTitle || 'Unknown'}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {new Date(learner.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-28">
                            <ProgressBar value={progress} size="sm" variant={progress === 100 ? 'success' : 'default'} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {learner.courseCompleted ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle size={10} className="mr-0.5" /> Completed
                            </Badge>
                          ) : progress > 0 ? (
                            <Badge variant="warning" size="sm">
                              <Clock size={10} className="mr-0.5" /> In Progress
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              <BookOpen size={10} className="mr-0.5" /> Enrolled
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Users}
          title={search ? "No students found" : "No enrollments yet"}
          description={search ? "Try a different search term" : "Students will appear here once they enroll in your courses."}
        />
      )}
    </div>
  );
};

export default StudentsEnrolled;
