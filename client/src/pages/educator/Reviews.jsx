import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, CheckCircle, Clock, ChevronLeft, ChevronRight, Reply } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
];

const StarRating = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}
      />
    ))}
  </div>
);

const Reviews = () => {
  const { api } = useAppContext();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseFilter, setCourseFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [savingReply, setSavingReply] = useState({});

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

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (courseFilter) params.set('courseId', courseFilter);
      if (ratingFilter) params.set('rating', ratingFilter);

      const res = await api.get(`/api/educator/reviews?${params}`);
      setData(res.data);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally { setLoading(false); }
  }, [api, page, courseFilter, ratingFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { setPage(1); }, [courseFilter, ratingFilter]);

  const handleReply = async (courseId, ratingId) => {
    const text = replyText[ratingId]?.trim();
    if (!text) return;
    setSavingReply(prev => ({ ...prev, [ratingId]: true }));
    try {
      await api.post(`/api/educator/courses/${courseId}/ratings/${ratingId}/reply`, { reply: text });
      setReplyText(prev => ({ ...prev, [ratingId]: '' }));
      setReplyingId(null);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to save reply:', err);
    } finally {
      setSavingReply(prev => ({ ...prev, [ratingId]: false }));
    }
  };

  const courseOptions = [
    { value: '', label: 'All Courses' },
    ...courses.map(c => ({ value: c._id, label: c.courseTitle })),
  ];

  const totalReviews = data?.total || 0;
  const reviews = data?.reviews || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''} across your courses</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-56">
          <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} options={courseOptions} />
        </div>
        <div className="w-36">
          <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} options={RATING_OPTIONS} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="avatar" className="h-9 w-9" />
                <div className="flex-1 space-y-1">
                  <Skeleton variant="text" className="w-40" />
                  <Skeleton variant="text" className="w-56" />
                </div>
                <Skeleton variant="text" className="w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load reviews" description={error} onRetry={fetchReviews} />
      ) : reviews.length > 0 ? (
        <>
          <Card variant="default" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Course</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Review</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reviews.map((review) => {
                    const student = review.student || {};
                    const hasReply = !!review.reply;
                    return (
                      <tr key={review._id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" src={student.avatar} alt={student.name} initials={student.name?.charAt(0)} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{student.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate hidden xs:block">{student.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          <p className="truncate max-w-40">{review.courseTitle}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <StarRating rating={review.rating} />
                            <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-muted-foreground max-w-64 truncate">{review.review || <span className="italic">No text review</span>}</p>
                        </td>
                        <td className="px-4 py-3">
                          {hasReply ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle size={10} className="mr-0.5" /> Replied
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              <Clock size={10} className="mr-0.5" /> Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {replyingId === review._id ? (
                            <div className="flex flex-col gap-2 items-end">
                              <input
                                type="text"
                                value={replyText[review._id] || ''}
                                onChange={(e) => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                                placeholder="Type your reply..."
                                className="w-full min-w-48 h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setReplyingId(null); setReplyText(prev => ({ ...prev, [review._id]: '' })); }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={savingReply[review._id]}
                                  disabled={!replyText[review._id]?.trim()}
                                  onClick={() => handleReply(review.courseId, review._id)}
                                >
                                  <Reply size={12} /> Send
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setReplyingId(review._id)}>
                              <Reply size={12} className="mr-1" /> {hasReply ? 'Edit' : 'Reply'}
                            </Button>
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
          icon={Star}
          title="No reviews yet"
          description="Reviews from students will appear here once they rate your courses."
        />
      )}
    </div>
  );
};

export default Reviews;
