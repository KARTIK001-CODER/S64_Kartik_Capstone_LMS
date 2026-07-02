import React, { useEffect, useState, useMemo } from "react";
import SearchBar from "../../components/student/SearchBar";
import { useNavigate, useParams } from "react-router-dom";
import CourseCard from "../../components/student/CourseCard";
import Footer from "../../components/student/Footer";
import * as jwt_decode from "jwt-decode";
import axios from "axios";

const API_BASE = 'http://localhost:5000';

const CoursesList = () => {
  const navigate = useNavigate();
  const { input } = useParams();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState(input || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwt_decode.jwtDecode(token);
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            localStorage.removeItem("token");
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        } catch {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener('authChanged', checkAuth);
    return () => window.removeEventListener('authChanged', checkAuth);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Set initial search term from URL parameter
  useEffect(() => {
    if (input) {
      setSearchTerm(input);
    }
  }, [input]);

  // Fetch courses with search + pagination
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ page, limit: 12 });
        if (searchTerm) params.set('search', searchTerm);

        const response = await axios.get(
          `${API_BASE}/api/courses?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = response.data;
        if (data?.courses) {
          setCourses(data.courses);
          setTotalPages(data.pages || 1);
        } else if (Array.isArray(data)) {
          setCourses(data);
        }
        setError(null);
      } catch (err) {
        setError("Failed to fetch courses. Please try again later.");
      }
    };

    if (isAuthenticated) {
      fetchCourses();
    }
  }, [isAuthenticated, searchTerm, page]);

  // Sort locally (client-side, after fetch)
  const sortedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const sorted = [...courses];
    switch (sortBy) {
      case "price-asc":
        return sorted.sort((a, b) => (a.coursePrice || 0) - (b.coursePrice || 0));
      case "price-desc":
        return sorted.sort((a, b) => (b.coursePrice || 0) - (a.coursePrice || 0));
      case "title-asc":
        return sorted.sort((a, b) => (a.courseTitle || '').localeCompare(b.courseTitle || ''));
      case "title-desc":
        return sorted.sort((a, b) => (b.courseTitle || '').localeCompare(a.courseTitle || ''));
      case "rating":
        return sorted.sort((a, b) => {
          const ratingA = a.courseRatings?.length
            ? a.courseRatings.reduce((s, r) => s + (r.rating || 0), 0) / a.courseRatings.length : 0;
          const ratingB = b.courseRatings?.length
            ? b.courseRatings.reduce((s, r) => s + (r.rating || 0), 0) / b.courseRatings.length : 0;
          return ratingB - ratingA;
        });
      default:
        return sorted;
    }
  }, [courses, sortBy]);

  const handleSearch = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-blue-50 to-gray-50 min-h-screen">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2 inline-block">
                Course List
              </h1>
              <div className="breadcrumbs flex items-center text-sm text-gray-600">
                <button
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                  onClick={() => navigate("/")}
                >
                  Home
                </button>
                <span className="mx-2">/</span>
                <span className="font-medium">Course List</span>
                {searchTerm && (
                  <>
                    <span className="mx-2">/</span>
                    <span className="italic">Search: "{searchTerm}"</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-2/3">
              <div className="w-full lg:w-1/2">
                <SearchBar onSearch={handleSearch} initialValue={searchTerm} />
              </div>
              <div className="w-full lg:w-1/2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Sort By</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="title-asc">Title: A to Z</option>
                  <option value="title-desc">Title: Z to A</option>
                  <option value="rating">Rating: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {sortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {sortedCourses.map((course, index) => (
              <CourseCard key={course._id || index} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-100">
            <p className="text-xl text-gray-600">
              {searchTerm
                ? `No courses found matching "${searchTerm}"`
                : "No courses available"}
            </p>
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(""); setPage(1); }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pb-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CoursesList;
