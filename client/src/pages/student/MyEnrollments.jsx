import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'rc-progress';
import { assets } from '../../assets/assets';

const API_BASE = 'http://localhost:5000';

const calculateTotalLectures = (course) => {
  if (!course?.courseContent) return 0;
  return course.courseContent.reduce(
    (acc, chapter) => acc + (chapter.lectures || chapter.chapterContent || []).length,
    0
  );
};

const MyEnrollments = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(
          `${API_BASE}/api/enrollments/student/enrolled-courses`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const data = await response.json();

        if (Array.isArray(data)) {
          const mapped = data.map(enrollment => ({
            ...enrollment.courseId,
            progress: enrollment.progress?.length || 0,
            totalLectures: calculateTotalLectures(enrollment.courseId)
          }));
          setEnrolledCourses(mapped);
        } else {
          setEnrolledCourses([]);
        }
      } catch (error) {
        setError(error.message || 'Failed to fetch enrolled courses');
        setEnrolledCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  // Calculate course duration from course content
  const calculateCourseDuration = (course) => {
    if (!course?.courseContent || !Array.isArray(course.courseContent)) {
      return "N/A";
    }

    let totalMinutes = 0;
    course.courseContent.forEach(chapter => {
      if (chapter?.chapterContent && Array.isArray(chapter.chapterContent)) {
        chapter.chapterContent.forEach(lecture => {
          if (typeof lecture?.lectureDuration === 'number') {
            totalMinutes += lecture.lectureDuration;
          }
        });
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  // Calculate completion percentage
  const calculateProgress = (course) => {
    if (!course?.progress || !course?.totalLectures) return 0;
    return (course.progress / course.totalLectures) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track your progress and continue learning
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/courses-list')} 
            className="mt-3 sm:mt-4 md:mt-0 px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 font-bold rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Explore New Courses
          </button>
        </div>

        {/* Course Cards Grid */}
        {enrolledCourses && enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course, index) => (
              <div 
                key={course._id || index} 
                onClick={() => navigate(`/player/${course._id}`)}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Course Image Banner */}
                <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
                  <img 
                    src={imgErrors[course._id] ? assets.course_1_thumbnail : (course.courseThumbnail || assets.course_1_thumbnail)} 
                    alt={course.courseTitle} 
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors(prev => ({ ...prev, [course._id]: true }))}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-4">
                    <span className={`px-2 sm:px-4 py-1 text-xs sm:text-sm font-bold rounded-full ${
                      calculateProgress(course) === 100 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {calculateProgress(course) === 100 ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {course.courseTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Duration: {calculateCourseDuration(course)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(calculateProgress(course))}%
                      </span>
                    </div>
                    <Line 
                      percent={calculateProgress(course)} 
                      strokeWidth={4} 
                      strokeColor="#3B82F6"
                      trailColor="#E5E7EB"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-100">
            <p className="text-xl text-gray-600">No enrolled courses found</p>
            <button
              onClick={() => navigate('/courses-list')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnrollments;