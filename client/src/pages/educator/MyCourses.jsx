import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Edit3, Trash2, Eye, ExternalLink, Copy, Archive,
  Search, ChevronLeft, ChevronRight, CheckSquare, Square,
  RotateCcw, BookOpen
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'archived', label: 'Archived' },
];

const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';

const MyCourses = () => {
  const navigate = useNavigate();
  const { api } = useAppContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [busyIds, setBusyIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);

  const withConfirm = (action) => setConfirmAction(action);

  const executeConfirm = async () => {
    if (!confirmAction) return;
    await confirmAction.onConfirm();
    setConfirmAction(null);
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const response = await api.get(`/api/courses/educator?${params}`);
      const data = response.data;
      setCourses(data.courses || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally { setLoading(false); }
  }, [api, page, search, statusFilter]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => { setPage(1); setSelected([]); }, [search, statusFilter]);

  const handleDelete = (courseId) => {
    withConfirm({
      title: 'Delete course?',
      message: 'This action cannot be undone.',
      onConfirm: async () => {
        setDeleting(courseId);
        try {
          await api.delete(`/api/courses/${courseId}`);
          setCourses(prev => prev.filter(c => c._id !== courseId));
        } catch { /* ignore */ } finally { setDeleting(null); }
      },
    });
  };

  const handleDuplicate = async (courseId) => {
    setDuplicating(courseId);
    try {
      await api.post(`/api/courses/${courseId}/duplicate`);
      fetchCourses();
    } catch { /* ignore */
    } finally { setDuplicating(null); }
  };

  const handleTogglePublish = async (course) => {
    setBusyIds(prev => new Set(prev).add(course._id));
    try {
      await api.put(`/api/courses/${course._id}`, {
        isPublished: !course.isPublished,
        courseContent: undefined
      });
      setCourses(prev => prev.map(c =>
        c._id === course._id ? { ...c, isPublished: !course.isPublished } : c
      ));
    } catch { /* ignore */
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(course._id); return n; });
    }
  };

  const handleToggleArchive = async (course) => {
    setBusyIds(prev => new Set(prev).add(course._id));
    try {
      await api.put(`/api/courses/${course._id}`, {
        isArchived: !course.isArchived,
        isPublished: course.isArchived ? course.isPublished : false,
        courseContent: undefined
      });
      setCourses(prev => prev.map(c =>
        c._id === course._id ? { ...c, isArchived: !course.isArchived, isPublished: course.isArchived ? c.isPublished : false } : c
      ));
    } catch { /* ignore */
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(course._id); return n; });
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === courses.length) setSelected([]);
    else setSelected(courses.map(c => c._id));
  };

  const handleBulkAction = (action) => {
    if (selected.length === 0) return;
    const exec = async () => {
      setBulkBusy(true);
      try {
        await api.post('/api/courses/bulk', { courseIds: selected, action });
        setSelected([]);
        fetchCourses();
      } catch { /* ignore */
      } finally { setBulkBusy(false); }
    };
    if (action === 'delete') {
      withConfirm({
        title: `Delete ${selected.length} course(s)?`,
        message: 'This action cannot be undone.',
        onConfirm: exec,
      });
    } else {
      exec();
    }
  };

  const getStatusBadge = (course) => {
    if (course.isArchived) return { variant: 'neutral', label: 'Archived' };
    if (course.isPublished) return { variant: 'success', label: 'Published' };
    return { variant: 'warning', label: 'Draft' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">{total} course{total !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => navigate('/educator/add-course')}>
          <PlusCircle size={16} /> Add Course
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              role="tab"
              aria-selected={statusFilter === tab.key}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5 animate-fade-in">
          <span className="text-sm font-medium text-foreground mr-2">{selected.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('publish')} loading={bulkBusy}><Eye size={14} /> Publish</Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('unpublish')} loading={bulkBusy}>Unpublish</Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')} loading={bulkBusy}><Archive size={14} /> Archive</Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('unarchive')} loading={bulkBusy}><RotateCcw size={14} /> Unarchive</Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')} loading={bulkBusy} className="text-error border-error/30 hover:bg-error/10 ml-auto">
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
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
      ) : error ? (
        <ErrorState title="Failed to load courses" description={error} onRetry={fetchCourses} />
      ) : courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => {
              const enrolledCount = course.enrolledStudents?.length || 0;
              const status = getStatusBadge(course);
              const isBusy = busyIds.has(course._id);
              return (
                <Card key={course._id} variant="default" padding="none" className={`overflow-hidden transition-all ${course.isArchived ? 'opacity-70' : ''}`}>
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <div className="absolute top-3 left-3 z-10">
                      <button
                        onClick={() => toggleSelect(course._id)}
                        className={`p-1 rounded ${selected.includes(course._id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} bg-background/80 backdrop-blur-sm`}
                      >
                        {selected.includes(course._id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </div>
                    <img
                      src={imgErrors[course._id] ? defaultThumbnail : (course.courseThumbnail || defaultThumbnail)}
                      alt={course.courseTitle}
                      className="w-full h-full object-cover"
                      onError={() => setImgErrors(prev => ({ ...prev, [course._id]: true }))}
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 flex gap-1">
                      {course.isArchived && <Badge variant="neutral" size="sm">Archived</Badge>}
                      <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <h3 className="text-sm font-semibold text-white line-clamp-1">{course.courseTitle}</h3>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>${course.coursePrice?.toFixed(2)}</span>
                      <span>&bull;</span>
                      <span>{enrolledCount} student{enrolledCount !== 1 ? 's' : ''}</span>
                      {course.difficulty && <><span>&bull;</span><span>{course.difficulty}</span></>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button variant="outline" size="xs" onClick={() => navigate(`/educator/edit-course/${course._id}`)}>
                        <Edit3 size={12} /> Edit
                      </Button>
                      {!course.isArchived && (
                        <Button variant="ghost" size="xs" onClick={() => handleTogglePublish(course)} loading={isBusy}>
                          {course.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                      )}
                      <Button variant="ghost" size="xs" onClick={() => handleToggleArchive(course)} loading={isBusy}>
                        {course.isArchived ? <RotateCcw size={12} /> : <Archive size={12} />}
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => handleDuplicate(course._id)} loading={duplicating === course._id}>
                        <Copy size={12} />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => handleDelete(course._id)} loading={deleting === course._id} className="text-muted-foreground hover:text-error">
                        <Trash2 size={12} />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => window.open(`/courses/${course._id}`, '_blank')}>
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} /> Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={search ? `No courses matching "${search}"` : "No courses yet"}
          description={search ? "Try a different search term" : "Create your first course to start teaching."}
          action={
            !search ? (
              <Button onClick={() => navigate('/educator/add-course')}>
                <PlusCircle size={16} /> Create Course
              </Button>
            ) : undefined
          }
        />
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 animate-scale-in" role="alertdialog" aria-labelledby="confirm-title">
            <h3 id="confirm-title" className="text-lg font-semibold text-foreground mb-2">{confirmAction.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{confirmAction.message}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={executeConfirm}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
