import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';
import { assets } from '../../assets/assets';
import Footer from '../../components/student/Footer';
import YouTube from 'react-youtube';
import humanizeDuration from 'humanize-duration';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

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

  useEffect(() => {
    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/courses/${id}`);
        setCourseData(data);

        // Initialize all sections as expanded
        if (data.courseContent) {
          const initialExpandState = {};
          data.courseContent.forEach(chapter => {
            initialExpandState[chapter._id] = true;
          });
          setExpandedSections(initialExpandState);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
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
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Calculate total lectures and duration
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
    if (!lecture || !lecture.videoUrl) {
      console.error('No video URL found for lecture:', lecture);
      return;
    }

    const videoId = extractYouTubeId(lecture.videoUrl);
    if (!videoId) {
      console.error('Invalid YouTube URL:', lecture.videoUrl);
      return;
    }

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
      await axios.delete(
        `${API_BASE_URL}/api/courses/${id}/rating`,
        getAuthHeaders()
      );
      setCourseData(prev => ({
        ...prev,
        courseRatings: prev.courseRatings.filter(r => {
          const studentId = r.student?._id || r.student;
          if (!user) return true;
          return studentId.toString() !== (user._id || user.id).toString();
        })
      }));
    } catch {
      console.error('Failed to delete review');
    } finally {
      setDeletingReview(false);
    }
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;

    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    // If no match found, try to extract ID directly (in case it's just the ID)
    if (!match) {
      // Check if it's just an 11-character video ID
      if (url.length === 11) {
        return url;
      }
      return null;
    }

    return (match && match[2].length === 11) ? match[2] : null;
  };

  const onPlayerError = (event) => {
    console.error('YouTube Player Error:', event.data);
  };

  const closeVideoPopup = () => {
    setShowVideoPopup(false);
    setSelectedVideoId(null);
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const authHeaders = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      // Step 1: Create order (or get direct enrollment in dev mode)
      const orderRes = await axios.post(
        `${API_BASE_URL}/api/payments/create-order`,
        { courseId: id },
        authHeaders
      );

      const orderData = orderRes.data;

      // Dev mode — enrolled directly without payment
      if (orderData.devMode) {
        setSuccess(true);
        setIsEnrolled(true);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'LMS Platform',
        description: `Course Enrollment - ${courseData?.courseTitle || ''}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Verify payment
          try {
            const verifyRes = await axios.post(
              `${API_BASE_URL}/api/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              authHeaders
            );

            if (verifyRes.data) {
              setSuccess(true);
              setIsEnrolled(true);
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        },
        prefill: {
          email: user.email || '',
          contact: ''
        },
        theme: {
          color: '#2563EB'
        }
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
    return <Loading />;
  }

  if (!courseData) {
    return <div className="text-red-500 font-bold py-4">Course not found.</div>;
  }

  // Calculate discounted price if discount exists
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
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Video Popup Modal */}
      {showVideoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Preview Video</h3>
              <button
                onClick={closeVideoPopup}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative" style={{ paddingTop: '56.25%' }}>
              <div className="absolute inset-0">
                {selectedVideoId && (
                  <YouTube
                    videoId={selectedVideoId}
                    opts={{
                      width: '100%',
                      height: '100%',
                      playerVars: {
                        autoplay: 0,
                        modestbranding: 1,
                        rel: 0,
                        controls: 1,
                        showinfo: 0,
                        fs: 1,
                        playsinline: 1,
                        enablejsapi: 1,
                        origin: window.location.origin,
                        widgetid: Math.floor(Math.random() * 1000)
                      }
                    }}
                    onError={(event) => {
                      console.error('YouTube Player Error:', event.data);
                    }}
                    onReady={(event) => {
                      console.log('Player Ready');
                    }}
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600">
                Click outside the video or press ESC to close
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gray-900 text-white pt-8 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{courseData.courseTitle}</h1>

            {/* Course brief details */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">★★★★★</span>
                <span>{calculateAverageRating()}</span>
                <span className="text-gray-400">({(courseData.courseRatings || courseData.courseRating || []).length} ratings)</span>
                <span className="text-gray-400">{courseData.enrolledStudents?.length || 0} students</span>
              </div>

              <p className="text-sm">
                {courseData.educator && <span>Course by <a href="#" className="text-blue-400 hover:underline">{courseData.educator.name || 'GreatStack'}</a></span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content Area */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* What you'll learn */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-4">What's in the course?</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Lifetime access with free updates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Step-by-step, hands-on guidance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Access to all course materials and code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Quizzes to test your knowledge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Certificate of completion</span>
                </li>
              </ul>
            </div>

            {/* Course Content */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-4">Course Structure</h2>
              <div className="text-sm text-gray-600 mb-4">
                {courseData.courseContent?.length || 0} sections • {totalLectures} lectures • {formatDuration(totalDuration)} total length
              </div>

              {/* Course Content Accordion */}
              <div className="border rounded-md">
                {courseData.courseContent?.sort((a, b) => (a.order || a.chapterOrder) - (b.order || b.chapterOrder)).map((chapter) => {
                  const lectures = chapter.lectures || chapter.chapterContent || [];
                  const chapterTitle = chapter.title || chapter.chapterTitle;

                  return (
                    <div key={chapter._id} className="border-b last:border-b-0">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(chapter._id)}
                        className="flex justify-between items-center w-full p-4 text-left font-medium focus:outline-none"
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{expandedSections[chapter._id] ? '▾' : '▸'}</span>
                          <span>{chapterTitle}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {lectures.length} lectures • {formatDuration(lectures.reduce((total, lecture) => total + (lecture.duration || lecture.lectureDuration || 0), 0))}
                        </div>
                      </button>

                      {/* Section Content */}
                      {expandedSections[chapter._id] && (
                        <div className="bg-gray-50 pl-10 pr-4">
                          {lectures.sort((a, b) => (a.order || a.lectureOrder) - (b.order || b.lectureOrder)).map((lecture) => (
                            <div key={lecture._id} className="py-3 border-t flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="mr-3 text-gray-400">▶</span>
                                <span>
                                  {lecture.title || lecture.lectureTitle}
                                  {lecture.isPreviewFree && (
                                    <button
                                      onClick={() => {
                                        console.log('Preview clicked for lecture:', lecture);
                                        handlePreviewClick(lecture);
                                      }}
                                      className="ml-2 text-xs text-blue-500 font-medium hover:text-blue-700"
                                    >
                                      [Preview]
                                    </button>
                                  )}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">{formatDuration(lecture.duration || lecture.lectureDuration || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-4">Course Description</h2>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
              />
            </div>

            {/* Reviews */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-4">
                Student Reviews ({(courseData.courseRatings || []).length})
              </h2>
              {(courseData.courseRatings || []).length > 0 ? (
                <div className="space-y-4">
                  {courseData.courseRatings.map((review) => {
                    const studentId = review.student?._id || review.student;
                    const isOwn = user && studentId?.toString() === (user._id || user.id).toString();
                    return (
                      <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {(review.student?.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {review.student?.name || 'Anonymous'}
                              </p>
                              <div className="flex items-center gap-1">
                                <Stars count={review.rating} />
                                <span className="text-xs text-gray-400 ml-1">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isOwn && (
                            <button
                              onClick={handleDeleteReview}
                              disabled={deletingReview}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-50"
                              title="Delete review"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {review.review && (
                          <p className="text-sm text-gray-600 mt-1 ml-12">{review.review}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          {/* Right Sidebar - Course Card */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-md sticky top-6">
              {/* Course Image */}
              <div className="relative">
                {courseData.courseThumbnail ? (
                  <img
                    src={courseData.courseThumbnail && courseData.courseThumbnail.startsWith('blob:') ? assets.course_1_thumbnail : courseData.courseThumbnail}
                    alt={courseData.courseTitle}
                    className="w-full rounded-t-lg h-48 object-cover"
                    onError={(e) => {
                      e.target.onerror = null; // prevent infinite loop
                      e.target.src = assets.course_1_thumbnail;
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}

                {playerData ? <iframe src={playerData.videoUrl} title="Course Video" className="w-full h-48 object-cover" /> : null}

                {/* Sale tag if discount exists */}
                {courseData.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                    {courseData.discount}% OFF
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">₹{(discountedPrice || 0).toFixed(2)}</span>
                    {courseData.discount > 0 && (
                      <span className="ml-3 line-through text-gray-500">₹{courseData.coursePrice.toFixed(2)}</span>
                    )}
                  </div>
                  {courseData.discount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">5 days left at this price!</p>
                  )}
                </div>

                {/* Course Stats */}
                <div className="flex items-center space-x-4 mb-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span>{calculateAverageRating()}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">⏱</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">📚</span>
                    <span>{totalLectures} lectures</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mb-3">
                  {isEnrolled ? (
                    <button
                      onClick={() => navigate(`/course/${id}/learn`)}
                      className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={isProcessing}
                      className={`w-full py-3 px-4 ${isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-semibold rounded-lg shadow-sm transition-colors`}
                    >
                      {isProcessing ? 'Processing...' : 'Enroll Now'}
                    </button>
                  )}

                  {error && (
                    <div className="text-red-500 text-sm text-center mt-3">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="text-green-500 text-sm text-center mt-3">
                      Successfully enrolled in the course!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stars = ({ count }) => {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= count ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
      ))}
    </span>
  );
};

export default CourseDetails;