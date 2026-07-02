import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock, Users, Star, ChevronDown, ChevronRight, BookOpen, Award, CheckCircle, Trash2, Shield, Infinity, FileText, X } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';
import Footer from '../../components/student/Footer';
import YouTube from 'react-youtube';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ProgressBar } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/ui/empty-state';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const { allCourses, user } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('curriculum');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/courses/${id}`);
        setCourseData(data);
        if (data.courseContent) {
          const initialExpandState = {};
          data.courseContent.forEach(chapter => { initialExpandState[chapter._id] = true; });
          setExpandedSections(initialExpandState);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (user && courseData?.enrolledStudents?.includes(user._id)) {
      setIsEnrolled(true);
    }
  }, [courseData, user]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const calculateCourseTotals = () => {
    if (!courseData?.courseContent) return { totalLectures: 0, totalDuration: 0 };
    let totalLectures = 0;
    let totalDuration = 0;
    courseData.courseContent.forEach(chapter => {
      const lectures = chapter.lectures || chapter.chapterContent || [];
      totalLectures += lectures.length;
      lectures.forEach(lecture => {
        totalDuration += (lecture.duration || lecture.lectureDuration || 0);
      });
    });
    return { totalLectures, totalDuration };
  };

  const { totalLectures, totalDuration } = calculateCourseTotals();

  const handlePreviewClick = (lecture) => {
    if (!lecture || !lecture.videoUrl) return;
    const videoId = extractYouTubeId(lecture.videoUrl);
    if (!videoId) return;
    setSelectedVideoId(videoId);
    setShowVideoPopup(true);
  };

  const [deletingReview, setDeletingReview] = useState(false);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  const handleDeleteReview = async (e) => {
    e.stopPropagation();
    if (deletingReview) return;
    setDeletingReview(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/courses/${id}/rating`, getAuthHeaders());
      setCourseData(prev => ({
        ...prev,
        courseRatings: prev.courseRatings.filter(r => {
          const studentId = r.student?._id || r.student;
          if (!user) return true;
          return studentId.toString() !== (user._id || user.id).toString();
        })
      }));
    } catch {
      // silent
    } finally {
      setDeletingReview(false);
    }
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (!match) {
      if (url.length === 11) return url;
      return null;
    }
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const closeVideoPopup = () => {
    setShowVideoPopup(false);
    setSelectedVideoId(null);
  };

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      setIsProcessing(true);
      setError(null);
      const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const orderRes = await axios.post(`${API_BASE_URL}/api/payments/create-order`, { courseId: id }, authHeaders);
      const orderData = orderRes.data;
      if (orderData.devMode) {
        setSuccess(true);
        setIsEnrolled(true);
        return;
      }
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Learnova',
        description: `Course Enrollment - ${courseData?.courseTitle || ''}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/api/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, authHeaders);
            if (verifyRes.data) { setSuccess(true); setIsEnrolled(true); }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: { ondismiss: function () { setIsProcessing(false); } },
        prefill: { email: user.email || '', contact: '' },
        theme: { color: '#2563EB' }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error?.description || 'Payment failed');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  if (loading && (!allCourses || allCourses.length === 0)) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <Skeleton variant="heading" className="h-12 w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton variant="card" />
              <Skeleton variant="card" />
            </div>
            <div><Skeleton variant="card" className="h-96" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState title="Course not found" description="The course you're looking for doesn't exist." onRetry={() => navigate('/courses-list')} />
      </div>
    );
  }

  const discountedPrice = courseData.discount
    ? courseData.coursePrice - (courseData.coursePrice * courseData.discount / 100)
    : courseData.coursePrice;

  const calculateAverageRating = () => {
    const ratings = courseData.courseRatings || courseData.courseRating || [];
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((total, current) => total + current.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const renderStars = (rating) => {
    return (
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={14} className={i <= Math.floor(rating) ? 'fill-warning text-warning' : 'text-neutral-300 dark:text-neutral-600'} />
        ))}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Video Popup */}
      {showVideoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={closeVideoPopup}>
          <div className="bg-card rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Preview Video</h3>
              <button onClick={closeVideoPopup} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="relative" style={{ paddingTop: '56.25%' }}>
              <div className="absolute inset-0">
                {selectedVideoId && (
                  <YouTube
                    videoId={selectedVideoId}
                    opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, modestbranding: 1, rel: 0, controls: 1 } }}
                    iframeClassName="w-full h-full"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: main info */}
            <div className="lg:col-span-2">
              <Badge variant="secondary" size="sm" className="mb-4">
                {courseData.courseCategory || 'Course'}
              </Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
                {courseData.courseTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  {renderStars(calculateAverageRating())}
                  <span className="text-sm font-medium text-foreground">{calculateAverageRating()}</span>
                  <span className="text-sm text-muted-foreground">({(courseData.courseRatings || courseData.courseRating || []).length} ratings)</span>
                </div>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users size={14} />
                  {courseData.enrolledStudents?.length || 0} students
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(totalDuration)}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <BookOpen size={14} />
                  {totalLectures} lectures
                </span>
              </div>
              {courseData.educator && (
                <p className="text-sm text-muted-foreground">
                  Created by <span className="font-medium text-foreground">{courseData.educator.name || 'Instructor'}</span>
                </p>
              )}
            </div>

            {/* Right: pricing card (visible on desktop) */}
            <div className="hidden lg:block">
              <Card variant="elevated" padding="md" className="sticky top-24">
                <div className="relative mb-4 rounded-lg overflow-hidden bg-muted aspect-video">
                  {courseData.courseThumbnail ? (
                    <img
                      src={courseData.courseThumbnail}
                      alt={courseData.courseTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}
                  {courseData.discount > 0 && (
                    <Badge variant="error" size="sm" className="absolute top-3 right-3">
                      {courseData.discount}% OFF
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">${(discountedPrice || 0).toFixed(2)}</span>
                  {courseData.discount > 0 && (
                    <span className="text-lg text-muted-foreground line-through">${courseData.coursePrice.toFixed(2)}</span>
                  )}
                </div>

                {isEnrolled ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => navigate(`/player/${id}`)}
                  >
                    <Play size={16} fill="currentColor" />
                    Continue Learning
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleEnroll}
                      loading={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Enroll Now'}
                    </Button>
                    {error && <p className="text-xs text-error text-center mt-2">{error}</p>}
                    {success && <p className="text-xs text-success text-center mt-2">Successfully enrolled!</p>}
                  </>
                )}

                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Infinity size={14} />
                    Full lifetime access
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Award size={14} />
                    Certificate of completion
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield size={14} />
                    30-day money-back guarantee
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Card variant="default" padding="none">
              <div className="flex border-b border-border">
                {['curriculum', 'description', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    {tab === 'curriculum' ? 'Curriculum' : tab === 'description' ? 'Description' : 'Reviews'}
                  </button>
                ))}
              </div>
            </Card>

            {/* Curriculum */}
            {activeTab === 'curriculum' && (
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Course Structure</h2>
                  <span className="text-sm text-muted-foreground">
                    {courseData.courseContent?.length || 0} sections &bull; {totalLectures} lectures &bull; {formatDuration(totalDuration)}
                  </span>
                </div>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {courseData.courseContent?.sort((a, b) => (a.order || a.chapterOrder) - (b.order || b.chapterOrder)).map((chapter) => {
                    const lectures = chapter.lectures || chapter.chapterContent || [];
                    const chapterTitle = chapter.title || chapter.chapterTitle;
                    return (
                      <div key={chapter._id}>
                        <button
                          onClick={() => toggleSection(chapter._id)}
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections[chapter._id] ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                            <span className="text-sm font-medium text-foreground">{chapterTitle}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {lectures.length} lectures &bull; {formatDuration(lectures.reduce((total, lecture) => total + (lecture.duration || lecture.lectureDuration || 0), 0))}
                          </span>
                        </button>
                        {expandedSections[chapter._id] && (
                          <div className="bg-muted/30 px-4 pb-2">
                            {lectures.sort((a, b) => (a.order || a.lectureOrder) - (b.order || b.lectureOrder)).map((lecture) => (
                              <div key={lecture._id} className="flex items-center justify-between py-2.5 border-t border-border first:border-0">
                                <div className="flex items-center gap-2">
                                  <Play size={12} className="text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm text-foreground">{lecture.title || lecture.lectureTitle}</span>
                                  {lecture.isPreviewFree && (
                                    <button
                                      onClick={() => handlePreviewClick(lecture)}
                                      className="text-xs text-primary font-medium hover:underline"
                                    >
                                      Preview
                                    </button>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDuration(lecture.duration || lecture.lectureDuration || 0)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Description */}
            {activeTab === 'description' && (
              <Card variant="default" padding="md">
                <h2 className="text-lg font-semibold text-foreground mb-4">Course Description</h2>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
                />
              </Card>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <Card variant="default" padding="md">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Student Reviews ({(courseData.courseRatings || []).length})
                </h2>
                {(courseData.courseRatings || []).length > 0 ? (
                  <div className="space-y-4">
                    {courseData.courseRatings.map((review) => {
                      const studentId = review.student?._id || review.student;
                      const isOwn = user && studentId?.toString() === (user._id || user.id).toString();
                      return (
                        <div key={review._id} className="flex items-start justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                              {(review.student?.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{review.student?.name || 'Anonymous'}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {renderStars(review.rating)}
                              </div>
                              {review.review && (
                                <p className="text-sm text-muted-foreground mt-2">{review.review}</p>
                              )}
                            </div>
                          </div>
                          {isOwn && (
                            <button onClick={handleDeleteReview} disabled={deletingReview} className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/5 rounded transition disabled:opacity-50">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">No reviews yet. Be the first to review!</div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar - mobile pricing card */}
          <div className="lg:hidden">
            <Card variant="elevated" padding="md" className="sticky top-24">
              <div className="relative mb-4 rounded-lg overflow-hidden bg-muted aspect-video">
                {courseData.courseThumbnail ? (
                  <img src={courseData.courseThumbnail} alt={courseData.courseTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
                {courseData.discount > 0 && (
                  <Badge variant="error" size="sm" className="absolute top-3 right-3">{courseData.discount}% OFF</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-foreground">${(discountedPrice || 0).toFixed(2)}</span>
                {courseData.discount > 0 && (
                  <span className="text-lg text-muted-foreground line-through">${courseData.coursePrice.toFixed(2)}</span>
                )}
              </div>
              {isEnrolled ? (
                <Button size="lg" className="w-full" onClick={() => navigate(`/player/${id}`)}>
                  <Play size={16} fill="currentColor" /> Continue Learning
                </Button>
              ) : (
                <Button size="lg" className="w-full" onClick={handleEnroll} loading={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Enroll Now'}
                </Button>
              )}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Infinity size={14} /> Full lifetime access</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Award size={14} /> Certificate of completion</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield size={14} /> 30-day money-back guarantee</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
