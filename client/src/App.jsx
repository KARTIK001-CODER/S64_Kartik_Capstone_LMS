import React, { Suspense, lazy } from 'react';
import { Routes, Route, useMatch, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { ToastProvider } from './components/ui/toast';

// Components
import Navbar from './components/student/Navbar';
import Loading from './components/student/Loading';

// Pages — eagerly loaded (frequently visited)
import Home from './pages/student/Home';
import NotFound from './pages/NotFound';
import CoursesList from './pages/student/CoursesList';
import Educator from './pages/educator/Educator';
import Dashboard from './pages/educator/Dashboard';
import Register from './pages/Register';
import Login from './pages/Login';

// Pages — lazy loaded (larger or less frequently used)
const CourseDetails = lazy(() => import('./pages/student/CourseDetails'));
const MyEnrollments = lazy(() => import('./pages/student/MyEnrollments'));
const Player = lazy(() => import('./pages/student/Player'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const Profile = lazy(() => import('./pages/student/Profile'));
const AddCourse = lazy(() => import('./pages/educator/AddCourse'));
const EditCourse = lazy(() => import('./pages/educator/EditCourse'));
const MyCourses = lazy(() => import('./pages/educator/MyCourses'));
const StudentsEnrolled = lazy(() => import('./pages/educator/StudentsEnrolled'));
const Reports = lazy(() => import('./pages/educator/Reports'));
const Reviews = lazy(() => import('./pages/educator/Reviews'));
const Notifications = lazy(() => import('./pages/educator/Notifications'));
const EducatorProfile = lazy(() => import('./pages/educator/Profile'));
const EducatorSettings = lazy(() => import('./pages/educator/Settings'));

const ProtectedRoute = ({ children, requireEducator = false }) => {
  const { user, loading } = useAppContext();
  if (loading) return <Loading fullScreen />;
  if (!user) return <Navigate to="/login" state={{ message: 'Please log in to access this page' }} />;
  if (requireEducator && user.role !== 'educator') return <Navigate to="/" state={{ message: 'Educator access required' }} />;
  return children;
};

const App = () => {
  const isEducatorRoute = useMatch('/educator/*');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
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
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } />
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
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Protected Educator Routes */}
            <Route path="/educator" element={
              <ProtectedRoute requireEducator>
                <Educator />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="add-course" element={<AddCourse />} />
              <Route path="edit-course/:id" element={<EditCourse />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="student-enrolled" element={<StudentsEnrolled />} />
              <Route path="courses/:courseId/students" element={<StudentsEnrolled />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<EducatorProfile />} />
              <Route path="settings" element={<EducatorSettings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
};

export default App;
