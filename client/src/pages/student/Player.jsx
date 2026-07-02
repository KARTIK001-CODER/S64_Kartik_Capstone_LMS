import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import YouTube from 'react-youtube';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { useContext } from 'react';
import Loading from '../../components/student/Loading';
import Footer from '../../components/student/Footer';
import Rating from '../../components/student/Rating';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const VideoPlayer = () => {
  const { courseId } = useParams();
  const { allCourses } = useContext(AppContext);
  const [playerData, setPlayerData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [currentLecture, setCurrentLecture] = useState({ chapterIndex: 0, lectureIndex: 0 });
  const [error, setError] = useState(null);
  const [completedLectures, setCompletedLectures] = useState(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/enrollments/student/course/${courseId}/progress`,
        getAuthHeaders()
      );
      const progress = res.data.progress || [];
      const completed = new Set(
        progress.filter(p => p.completed).map(p => p.lectureId)
      );
      setCompletedLectures(completed);
    } catch {
      // Not enrolled or no progress yet — not an error
      setCompletedLectures(new Set());
    }
  }, [courseId, getAuthHeaders]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_BASE}/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const course = response.data;

        if (course) {
          setCourseData(course);
          // Set existing user rating if available
          if (course.courseRatings && token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const existingRating = course.courseRatings.find(
                r => (r.student?._id || r.student) === (payload.id || payload._id)
              );
              if (existingRating) {
                setUserRating(existingRating.rating);
              }
            } catch { /* ignore token decode errors */ }
          }
          if (course.courseContent) {
            const initialExpandState = {};
            course.courseContent.forEach(chapter => {
              initialExpandState[chapter._id] = true;
            });
            setExpandedSections(initialExpandState);
          }
          if (course.courseContent && course.courseContent.length > 0) {
            const firstChapter = course.courseContent[0];
            if (firstChapter.lectures && firstChapter.lectures.length > 0) {
              const firstLecture = firstChapter.lectures[0];
              const videoUrl = firstLecture.videoUrl || firstLecture.lectureUrl;
              if (videoUrl) {
                const videoId = extractYouTubeId(videoUrl);
                if (videoId) {
                  setPlayerData({
                    videoId,
                    chapter: 1,
                    lecture: 1,
                    lectureTitle: firstLecture.title || firstLecture.lectureTitle,
                    lectureUrl: videoUrl
                  });
                  setCurrentLecture({ chapterIndex: 0, lectureIndex: 0 });
                } else {
                  setError('Invalid YouTube video URL');
                }
              } else {
                setError('No video URL found for this lecture');
              }
            } else {
              setError('No lectures found in this chapter');
            }
          } else {
            setError('No chapters found in this course');
          }
        } else {
          setError('Course not found');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Error loading course data');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
      fetchProgress();
    }
  }, [allCourses, courseId, fetchProgress]);

  const handleMarkComplete = async () => {
    if (!courseData?.courseContent || markingComplete) return;

    const { chapterIndex, lectureIndex } = currentLecture;
    const lecture = courseData.courseContent[chapterIndex]?.lectures?.[lectureIndex];
    if (!lecture) return;

    const lectureId = lecture._id;
    if (completedLectures.has(lectureId)) return;

    setMarkingComplete(true);
    try {
      await axios.put(
        `${API_BASE}/api/enrollments/student/course/${courseId}/progress`,
        { lectureId },
        getAuthHeaders()
      );
      setCompletedLectures(prev => {
        const next = new Set(prev);
        next.add(lectureId);
        return next;
      });
    } catch (err) {
      console.error('Failed to mark lecture as complete:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleRateCourse = async (rating) => {
    if (submittingRating || rating === userRating) return;
    setSubmittingRating(true);
    try {
      await axios.put(
        `${API_BASE}/api/courses/${courseId}/rating`,
        { rating, review: '' },
        getAuthHeaders()
      );
      setUserRating(rating);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!courseData?.courseContent) return 0;
    const total = courseData.courseContent.reduce(
      (acc, ch) => acc + (ch.lectures || []).length, 0
    );
    if (total === 0) return 0;
    return Math.round((completedLectures.size / total) * 100);
  };

  const isLectureCompleted = (chapterIdx, lectureIdx) => {
    const lecture = courseData?.courseContent?.[chapterIdx]?.lectures?.[lectureIdx];
    return lecture ? completedLectures.has(lecture._id) : false;
  };

  const currentLectureIsCompleted = () => {
    const { chapterIndex, lectureIndex } = currentLecture;
    return isLectureCompleted(chapterIndex, lectureIndex);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    try {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^#&?]*).*/,
        /^([a-zA-Z0-9_-]{11})$/,
        /youtube\.com\/shorts\/([^#&?]*)/,
        /youtube\.com\/watch\?.*v=([^#&?]*)/,
        /youtube\.com\/embed\/([^#&?]*)/,
        /youtube-nocookie\.com\/embed\/([^#&?]*)/,
        /youtube\.com\/watch\?.*feature=.*&v=([^#&?]*)/,
        /youtube\.com\/watch\?.*t=.*&v=([^#&?]*)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
      if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(lastPart)) return lastPart;
      return null;
    } catch {
      return null;
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const handleWatch = (chapterIdx, lectureIdx) => {
    try {
      if (!courseData?.courseContent?.[chapterIdx]?.lectures?.[lectureIdx]) {
        setError('Invalid chapter or lecture selection');
        return;
      }
      const chapter = courseData.courseContent[chapterIdx];
      const lecture = chapter.lectures[lectureIdx];
      const videoUrl = lecture.videoUrl || lecture.lectureUrl;
      if (!videoUrl) {
        setError('No video URL found for this lecture');
        return;
      }
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) {
        setError('Invalid YouTube video URL');
        return;
      }
      setPlayerData({
        videoId,
        chapter: chapterIdx + 1,
        lecture: lectureIdx + 1,
        lectureTitle: lecture.title || lecture.lectureTitle,
        lectureUrl: videoUrl
      });
      setCurrentLecture({ chapterIndex: chapterIdx, lectureIndex: lectureIdx });
      setError(null);
    } catch {
      setError('Error loading video');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!courseData) {
    return <div className="text-red-500 font-bold py-4">Course not found.</div>;
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {playerData ? (
                <div className="relative">
                  <YouTube
                    videoId={playerData.videoId}
                    opts={{
                      width: '100%',
                      height: '100%',
                      playerVars: {
                        autoplay: 1,
                        modestbranding: 1,
                        rel: 0,
                        controls: 1,
                        showinfo: 0,
                        fs: 1,
                        playsinline: 1,
                        enablejsapi: 1,
                        origin: window.location.origin,
                        host: 'https://www.youtube.com'
                      }
                    }}
                    onError={() => setError('Failed to load video')}
                    onReady={() => setError(null)}
                    iframeClassName="w-full aspect-video"
                    className="w-full aspect-video"
                  />
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                      <div className="text-white text-center p-4">
                        <p className="text-lg font-semibold mb-2">Error Loading Video</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-800 w-full aspect-video">
                  <img className="w-3.5" src={assets.time_left_clock_icon} alt="time left clock icon" />
                </div>
              )}
              {playerData && (
                <>
                  <div className="flex justify-between items-center mt-2 px-4 pb-2">
                    <p className="text-sm text-gray-700 font-medium">
                      {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
                    </p>
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete || currentLectureIsCompleted()}
                      className={`text-sm font-semibold px-4 py-1.5 rounded transition-colors ${
                        currentLectureIsCompleted()
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {markingComplete ? 'Saving...' : currentLectureIsCompleted() ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-500 mb-1">Rate this course:</p>
                    <Rating initialRating={userRating} onRate={handleRateCourse} />
                  </div>
                </>
              )}
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Course Description</h2>
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
              />
            </div>
          </div>

          {/* Course Content Sidebar */}
          <div className="lg:col-span-1">
            {/* Overall Progress Bar */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Course Progress</h3>
                <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {completedLectures.size} of{' '}
                {courseData.courseContent?.reduce((acc, ch) => acc + (ch.lectures || []).length, 0)}{' '}
                lectures completed
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-bold mb-4">Course Structure</h2>
              {courseData?.courseContent ? (
                <div className="space-y-2">
                  {courseData.courseContent.map((chapter, chapterIdx) => {
                    const chapterTitle = chapter.chapterTitle || chapter.title;
                    const lectures = chapter.chapterContent || chapter.lectures || [];
                    const totalMinutes = lectures.reduce((sum, lec) => sum + (lec.duration || lec.lectureDuration || 0), 0);
                    const isCurrentChapter = currentLecture.chapterIndex === chapterIdx;

                    return (
                      <div
                        key={chapter._id}
                        className={`border rounded-md mb-2 ${isCurrentChapter ? 'border-blue-500' : 'border-gray-200'}`}
                      >
                        <button
                          onClick={() => toggleSection(chapter._id)}
                          className="w-full p-3 text-left font-medium flex justify-between items-center hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">{chapterIdx + 1}.</span>
                            <span className="font-medium">{chapterTitle}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              {lectures.length} lectures • {formatDuration(totalMinutes)}
                            </span>
                            <span className="text-gray-400">
                              {expandedSections[chapter._id] ? '▼' : '▶'}
                            </span>
                          </div>
                        </button>
                        {expandedSections[chapter._id] && (
                          <div className="pl-4 pb-2">
                            {lectures.map((lecture, lectureIdx) => {
                              const lectureTitle = lecture.lectureTitle || lecture.title;
                              const lectureDuration = lecture.duration || lecture.lectureDuration || 0;
                              const isCurrent =
                                currentLecture.chapterIndex === chapterIdx &&
                                currentLecture.lectureIndex === lectureIdx;
                              const completed = isLectureCompleted(chapterIdx, lectureIdx);

                              return (
                                <div
                                  key={lecture._id}
                                  className={`py-2 px-2 rounded-md flex items-center justify-between ${
                                    isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {completed ? (
                                      <span className="text-green-500 flex-shrink-0">✓</span>
                                    ) : (
                                      <span className="text-gray-400 flex-shrink-0">▶</span>
                                    )}
                                    <span className="text-sm truncate">
                                      {chapterIdx + 1}.{lectureIdx + 1} {lectureTitle}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      className={`text-sm px-2 py-1 rounded ${
                                        isCurrent
                                          ? 'bg-blue-500 text-white'
                                          : 'text-blue-600 hover:bg-blue-50'
                                      }`}
                                      onClick={() => handleWatch(chapterIdx, lectureIdx)}
                                    >
                                      {isCurrent ? 'Playing' : 'Watch'}
                                    </button>
                                    <span className="text-xs text-gray-500">
                                      {formatDuration(lectureDuration)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No course content available</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VideoPlayer;
