import React, { Suspense, lazy } from 'react';
import { Routes, Route, useMatch, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';

// Components
import Navbar from './components/student/Navbar';
import Loading from './components/student/Loading';

// Pages — eagerly loaded (frequently visited)
import Home from './pages/student/Home';
import CoursesList from './pages/student/CoursesList';
import Educator from './pages/educator/Educator';
import Dashboard from './pages/educator/Dashboard';
import Register from './pages/Register';
import Login from './pages/Login';

// Pages — lazy loaded (larger or less frequently used)
const CourseDetails = lazy(() => import('./pages/student/CourseDetails'));
const MyEnrollments = lazy(() => import('./pages/student/MyEnrollments'));
const Player = lazy(() => import('./pages/student/Player'));
const AddCourse = lazy(() => import('./pages/educator/AddCourse'));
const EditCourse = lazy(() => import('./pages/educator/EditCourse'));
const MyCourses = lazy(() => import('./pages/educator/MyCourses'));
const StudentsEnrolled = lazy(() => import('./pages/educator/StudentsEnrolled'));
const Reports = lazy(() => import('./pages/educator/Reports'));

const ProtectedRoute = ({ children, requireEducator = false }) => {
  const { user, loading } = useAppContext();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (requireEducator && user.role !== 'educator') return <Navigate to="/" />;
  return children;
};

const App = () => {
  const isEducatorRoute = useMatch('/educator/*');

  return (
    <div className="text-default min-h-screen bg-white">
      {!isEducatorRoute && <Navbar />}
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/courses-list" element={<CoursesList />} />
          <Route path="/courses-list/:input" element={<CoursesList />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Student Routes */}
          <Route path="/my-enrollments" element={
            <ProtectedRoute>
              <MyEnrollments />
            </ProtectedRoute>
          } />
          <Route path="/player/:courseId" element={
            <ProtectedRoute>
              <Player />
            </ProtectedRoute>
          } />

          {/* Protected Educator Routes */}
          <Route path="/educator" element={
            <ProtectedRoute requireEducator>
              <Educator />
            </ProtectedRoute>
          } />
          <Route path="/educator/dashboard" element={
            <ProtectedRoute requireEducator>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/educator/add-course" element={
            <ProtectedRoute requireEducator>
              <AddCourse />
            </ProtectedRoute>
          } />
          <Route path="/educator/edit-course/:id" element={
            <ProtectedRoute requireEducator>
              <EditCourse />
            </ProtectedRoute>
          } />
          <Route path="/educator/my-courses" element={
            <ProtectedRoute requireEducator>
              <MyCourses />
            </ProtectedRoute>
          } />
          <Route path="/educator/student-enrolled" element={
            <ProtectedRoute requireEducator>
              <StudentsEnrolled />
            </ProtectedRoute>
          } />
          <Route path="/educator/courses/:courseId/students" element={
            <ProtectedRoute requireEducator>
              <StudentsEnrolled />
            </ProtectedRoute>
          } />
          <Route path="/educator/reports" element={
            <ProtectedRoute requireEducator>
              <Reports />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
