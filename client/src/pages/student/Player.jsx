import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, CheckCircle, Play, Clock, FileText, Download, Check, Award, X } from 'lucide-react';
import YouTube from 'react-youtube';
import { AppContext } from '../../context/AppContext';
import { useContext } from 'react';
import Loading from '../../components/student/Loading';
import Rating from '../../components/student/Rating';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ProgressBar } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/ui/empty-state';

const API_BASE = 'http://localhost:5000';

const VideoPlayer = () => {
  const { courseId } = useParams();
  const { fetchUserEnrolledCourses } = useContext(AppContext);
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
  const [lastWatchedInfo, setLastWatchedInfo] = useState(null);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [progressInitialized, setProgressInitialized] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const resumeApplied = useRef(false);
  const playerRef = useRef(null);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/enrollments/${courseId}/progress`, getAuthHeaders());
      const data = res.data;
      const progress = data.progress || [];
      const completed = new Set(progress.filter(p => p.completed).map(p => p.lectureId));
      setCompletedLectures(completed);
      setCourseCompleted(data.courseCompleted || false);
      if (data.lastWatchedChapterIndex !== null && data.lastWatchedChapterIndex !== undefined) {
        setLastWatchedInfo({ chapterIndex: data.lastWatchedChapterIndex, lectureIndex: data.lastWatchedLectureIndex });
      }
    } catch {
      setCompletedLectures(new Set());
      setCourseCompleted(false);
      setLastWatchedInfo(null);
    } finally {
      setProgressInitialized(true);
    }
  }, [courseId, getAuthHeaders]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await axios.get(`${API_BASE}/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const course = response.data;
        if (course) {
          setCourseData(course);
          if (course.courseRatings && token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const existingRating = course.courseRatings.find(r => (r.student?._id || r.student) === (payload.id || payload._id));
              if (existingRating) setUserRating(existingRating.rating);
            } catch { /* ignore */ }
          }
          if (course.courseContent) {
            const initialExpandState = {};
            course.courseContent.forEach(chapter => { initialExpandState[chapter._id] = true; });
            setExpandedSections(initialExpandState);
          }
          if (course.courseContent?.length > 0) {
            const firstChapter = course.courseContent[0];
            if (firstChapter.lectures?.length > 0) {
              const firstLecture = firstChapter.lectures[0];
              const videoUrl = firstLecture.videoUrl || firstLecture.lectureUrl;
              if (videoUrl) {
                const videoId = extractYouTubeId(videoUrl);
                if (videoId) {
                  setPlayerData({
                    videoId, chapter: 1, lecture: 1,
                    lectureTitle: firstLecture.title || firstLecture.lectureTitle,
                    lectureUrl: videoUrl
                  });
                  setCurrentLecture({ chapterIndex: 0, lectureIndex: 0 });
                } else setError('Invalid YouTube video URL');
              } else setError('No video URL found for this lecture');
            } else setError('No lectures found in this chapter');
          } else setError('No chapters found in this course');
        } else setError('Course not found');
      } catch (error) {
        setError(error.response?.data?.message || 'Error loading course data');
      } finally { setLoading(false); }
    };
    if (courseId) { fetchCourseData(); fetchProgress(); }
  }, [courseId, fetchProgress]);

  useEffect(() => {
    if (!courseCompleted || !courseId) return;
    const checkCertificate = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/certificates/${courseId}`, getAuthHeaders());
        setCertificate(res.data);
      } catch { setCertificate(null); }
    };
    checkCertificate();
  }, [courseCompleted, courseId, getAuthHeaders]);

  const handleGenerateCertificate = async () => {
    setCertificateLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/certificates/generate/${courseId}`, {}, getAuthHeaders());
      setCertificate(res.data);
      handleDownloadCertificate(res.data.certificateId);
    } catch { /* silent */ } finally { setCertificateLoading(false); }
  };

  const handleDownloadCertificate = async (certId) => {
    try {
      const id = certId || certificate?.certificateId;
      if (!id) return;
      const response = await axios.get(`${API_BASE}/api/certificates/download/${id}`, { ...getAuthHeaders(), responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `certificate-${id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // Resume at last-watched position
  useEffect(() => {
    if (!courseData?.courseContent?.length || !progressInitialized || resumeApplied.current) return;
    resumeApplied.current = true;
    if (!lastWatchedInfo) return;
    const { chapterIndex, lectureIndex } = lastWatchedInfo;
    if (chapterIndex === 0 && lectureIndex === 0) return;
    const chapter = courseData.courseContent?.[chapterIndex];
    const lecture = chapter?.lectures?.[lectureIndex];
    if (!lecture) return;
    const videoUrl = lecture.videoUrl || lecture.lectureUrl;
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return;
    setPlayerData({ videoId, chapter: chapterIndex + 1, lecture: lectureIndex + 1, lectureTitle: lecture.title || lecture.lectureTitle, lectureUrl: videoUrl });
    setCurrentLecture({ chapterIndex, lectureIndex });
  }, [courseData, progressInitialized, lastWatchedInfo]);

  const handleMarkComplete = async () => {
    if (!courseData?.courseContent || markingComplete) return;
    const { chapterIndex, lectureIndex } = currentLecture;
    const lecture = courseData.courseContent[chapterIndex]?.lectures?.[lectureIndex];
    if (!lecture) return;
    const lectureId = lecture._id;
    if (completedLectures.has(lectureId)) return;
    setMarkingComplete(true);
    try {
      await axios.put(`${API_BASE}/api/enrollments/${courseId}/progress`, { lectureId }, getAuthHeaders());
      const prevCount = completedLectures.size;
      const total = courseData.courseContent.reduce((acc, ch) => acc + (ch.lectures || []).length, 0);
      setCompletedLectures(prev => { const next = new Set(prev); next.add(lectureId); return next; });
      if (prevCount + 1 >= total) setCourseCompleted(true);
      fetchUserEnrolledCourses?.();
    } catch { /* silent */ } finally { setMarkingComplete(false); }
  };

  const handleRateCourse = async (rating) => {
    if (submittingRating || rating === userRating) return;
    setSubmittingRating(true);
    try {
      await axios.put(`${API_BASE}/api/courses/${courseId}/rating`, { rating, review: '' }, getAuthHeaders());
      setUserRating(rating);
    } catch { /* silent */ } finally { setSubmittingRating(false); }
  };

  const getCompletionPercentage = () => {
    if (!courseData?.courseContent) return 0;
    const total = courseData.courseContent.reduce((acc, ch) => acc + (ch.lectures || []).length, 0);
    if (total === 0) return 0;
    return Math.round((completedLectures.size / total) * 100);
  };

  const isLectureCompleted = (chapterIdx, lectureIdx) => {
    const lecture = courseData?.courseContent?.[chapterIdx]?.lectures?.[lectureIdx];
    return lecture ? completedLectures.has(lecture._id) : false;
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    try {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^#&?]*).*/,
        /^([a-zA-Z0-9_-]{11})$/,
        /youtube\.com\/shorts\/([^#&?]*)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
      if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
      return null;
    } catch { return null; }
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
        setError('Invalid chapter or lecture selection'); return;
      }
      const chapter = courseData.courseContent[chapterIdx];
      const lecture = chapter.lectures[lectureIdx];
      const videoUrl = lecture.videoUrl || lecture.lectureUrl;
      if (!videoUrl) { setError('No video URL found'); return; }
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) { setError('Invalid YouTube URL'); return; }
      setPlayerData({ videoId, chapter: chapterIdx + 1, lecture: lectureIdx + 1, lectureTitle: lecture.title || lecture.lectureTitle, lectureUrl: videoUrl });
      setCurrentLecture({ chapterIndex: chapterIdx, lectureIndex: lectureIdx });
      setError(null);
      const lectureId = lecture._id || lecture.id;
      axios.put(`${API_BASE}/api/enrollments/${courseId}/last-watched`, { lectureId, chapterIndex: chapterIdx, lectureIndex: lectureIdx }, getAuthHeaders()).catch(() => {});
    } catch { setError('Error loading video'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <div className="flex-1 p-8 space-y-4">
            <Skeleton variant="thumbnail" />
            <Skeleton variant="title" />
            <Skeleton variant="text" />
          </div>
          <div className="w-96 border-l border-border p-4 space-y-4 hidden lg:block">
            <Skeleton variant="title" />
            {[...Array(5)].map((_, i) => <Skeleton key={i} variant="text" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState title="Course not found" description="The course you're looking for doesn't exist." />
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Video + Content area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Player */}
          <div className="bg-black relative">
            {playerData ? (
              <div className="relative">
                <YouTube
                  videoId={playerData.videoId}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 1, modestbranding: 1, rel: 0, controls: 1,
                      fs: 1, playsinline: 1, enablejsapi: 1,
                      origin: window.location.origin,
                    }
                  }}
                  onError={() => setError('Failed to load video')}
                  onReady={() => setError(null)}
                  iframeClassName="w-full aspect-video"
                  className="w-full aspect-video"
                />
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/75">
                    <div className="text-white text-center p-4">
                      <p className="text-lg font-semibold mb-2">Error Loading Video</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center bg-muted w-full aspect-video">
                <p className="text-white/60 text-sm">Select a lecture to begin</p>
              </div>
            )}
          </div>

          {/* Lecture info + actions */}
          {playerData && (
            <div className="border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                    aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
                  >
                    {showSidebar ? <X size={18} /> : <FileText size={18} />}
                  </button>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={completedLectures.has(courseData.courseContent[currentLecture.chapterIndex]?.lectures?.[currentLecture.lectureIndex]?._id) ? 'secondary' : 'primary'}
                    onClick={handleMarkComplete}
                    loading={markingComplete}
                    disabled={completedLectures.has(courseData.courseContent[currentLecture.chapterIndex]?.lectures?.[currentLecture.lectureIndex]?._id)}
                  >
                    {completedLectures.has(courseData.courseContent[currentLecture.chapterIndex]?.lectures?.[currentLecture.lectureIndex]?._id)
                      ? <><Check size={14} /> Completed</>
                      : <Download size={14} />}
                    {!completedLectures.has(courseData.courseContent[currentLecture.chapterIndex]?.lectures?.[currentLecture.lectureIndex]?._id) && 'Mark Complete'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Course description tab */}
          <div className="flex-1 p-6">
            <div className="max-w-3xl">
              <h3 className="text-base font-semibold text-foreground mb-2">About this course</h3>
              <div
                className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
              />

              {/* Rating section */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-2">Rate this course</p>
                <Rating initialRating={userRating} onRate={handleRateCourse} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Course Curriculum */}
        <div className={`w-96 border-l border-border bg-card flex-shrink-0 overflow-y-auto ${
          showSidebar ? 'hidden lg:block' : 'hidden'
        }`}>
          {/* Progress */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Course Progress</span>
              <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
            </div>
            <ProgressBar value={completionPercentage} max={100} size="sm" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {completedLectures.size} of {courseData.courseContent?.reduce((acc, ch) => acc + (ch.lectures || []).length, 0)} lectures
            </p>
            {courseCompleted && (
              <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-success font-semibold text-sm">
                  <Award size={16} />
                  Course Completed!
                </div>
                <Button
                  size="sm"
                  variant="success"
                  onClick={certificate ? () => handleDownloadCertificate() : handleGenerateCertificate}
                  loading={certificateLoading}
                >
                  <Download size={14} />
                  {certificate ? 'Download Certificate' : 'Get Certificate'}
                </Button>
              </div>
            )}
          </div>

          {/* Curriculum */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Course Content</h3>
            <div className="space-y-2">
              {courseData?.courseContent?.map((chapter, chapterIdx) => {
                const chapterTitle = chapter.chapterTitle || chapter.title;
                const lectures = chapter.chapterContent || chapter.lectures || [];
                const totalMinutes = lectures.reduce((sum, lec) => sum + (lec.duration || lec.lectureDuration || 0), 0);
                const isCurrentChapter = currentLecture.chapterIndex === chapterIdx;

                return (
                  <div key={chapter._id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => toggleSection(chapter._id)}
                      className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                        isCurrentChapter ? 'bg-primary/5' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {expandedSections[chapter._id] ? <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}
                        <span className="text-xs font-medium text-foreground truncate">{chapterTitle}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">{lectures.length} lectures</span>
                    </button>
                    {expandedSections[chapter._id] && (
                      <div className="border-t border-border">
                        {lectures.map((lecture, lectureIdx) => {
                          const isCurrent = currentLecture.chapterIndex === chapterIdx && currentLecture.lectureIndex === lectureIdx;
                          const completed = isLectureCompleted(chapterIdx, lectureIdx);
                          return (
                            <button
                              key={lecture._id}
                              onClick={() => handleWatch(chapterIdx, lectureIdx)}
                              className={`w-full px-3 py-2.5 flex items-center gap-2 text-left transition-colors ${
                                isCurrent ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-accent/50 border-l-2 border-transparent'
                              }`}
                            >
                              {completed ? (
                                <CheckCircle size={12} className="text-success flex-shrink-0" />
                              ) : (
                                <Play size={12} className="text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={`text-xs truncate flex-1 ${isCurrent ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                                {chapterIdx + 1}.{lectureIdx + 1} {lecture.title || lecture.lectureTitle}
                              </span>
                              <span className="text-[11px] text-muted-foreground flex-shrink-0">
                                {formatDuration(lecture.duration || lecture.lectureDuration || 0)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
