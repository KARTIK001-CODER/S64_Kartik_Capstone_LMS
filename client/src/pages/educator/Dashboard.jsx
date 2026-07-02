import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import axios from 'axios'

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEnrollments, setTotalEnrollments] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching courses...');
        const response = await axios.get('http://localhost:5000/api/courses/educator', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response data:', response.data);

        const data = response.data?.courses || response.data;

        if (Array.isArray(data)) {
          setCourses(data);
          const total = data.reduce((sum, course) =>
            sum + (course.enrolledStudents?.length || 0), 0);
          setTotalEnrollments(total);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message || 'Failed to fetch courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="flex gap-6 mb-8">
        <div className="flex-1 flex items-center gap-4 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <img src={assets.user_icon} alt="icon" className="w-10 h-10" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{totalEnrollments}</div>
            <div className="text-gray-500 text-sm">Total Enrollments</div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4 bg-white rounded-lg shadow-sm border-2 border-blue-400 px-6 py-4">
          <img src={assets.my_course_icon} alt="icon" className="w-10 h-10" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{courses.length}</div>
            <div className="text-gray-500 text-sm">Total Courses</div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <img src={assets.earning_icon} alt="icon" className="w-10 h-10" />
          <div>
            <div className="text-2xl font-bold text-gray-800">${courses.reduce((sum, course) => sum + (course.coursePrice * (course.enrolledStudents?.length || 0)), 0)}</div>
            <div className="text-gray-500 text-sm">Total Earnings</div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">All Courses</h2>
        {courses.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-4 text-left font-medium">Title</th>
                <th className="py-2 px-4 text-left font-medium">Price</th>
                <th className="py-2 px-4 text-left font-medium">Enrollments</th>
                <th className="py-2 px-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course._id} className="border-b last:border-b-0">
                  <td className="py-2 px-4">{course.courseTitle}</td>
                  <td className="py-2 px-4">${course.coursePrice}</td>
                  <td className="py-2 px-4">{course.enrolledStudents?.length || 0}</td>
                  <td className="py-2 px-4">{course.isPublished ? 'Published' : 'Draft'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">No courses found</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
