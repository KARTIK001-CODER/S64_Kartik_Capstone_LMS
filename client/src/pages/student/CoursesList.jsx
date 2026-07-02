import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import * as jwt_decode from "jwt-decode";
import axios from "axios";
import CourseCard from "../../components/student/CourseCard";
import Footer from "../../components/student/Footer";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Skeleton, SkeletonCard } from "../../components/ui/skeleton";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";

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

  useEffect(() => {
    if (input) setSearchTerm(input);
  }, [input]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ page, limit: 12 });
        if (searchTerm) params.set('search', searchTerm);

        const response = await axios.get(`${API_BASE}/api/courses?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (data?.courses) {
          setCourses(data.courses);
          setTotalPages(data.pages || 1);
        } else if (Array.isArray(data)) {
          setCourses(data);
        }
        setError(null);
      } catch {
        setError("Failed to fetch courses.");
      }
    };

    if (isAuthenticated) fetchCourses();
  }, [isAuthenticated, searchTerm, page]);

  const sortedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const sorted = [...courses];
    switch (sortBy) {
      case "price-asc": return sorted.sort((a, b) => (a.coursePrice || 0) - (b.coursePrice || 0));
      case "price-desc": return sorted.sort((a, b) => (b.coursePrice || 0) - (a.coursePrice || 0));
      case "title-asc": return sorted.sort((a, b) => (a.courseTitle || '').localeCompare(b.courseTitle || ''));
      case "title-desc": return sorted.sort((a, b) => (b.courseTitle || '').localeCompare(a.courseTitle || ''));
      case "rating": return sorted.sort((a, b) => {
        const ratingA = a.courseRatings?.length ? a.courseRatings.reduce((s, r) => s + (r.rating || 0), 0) / a.courseRatings.length : 0;
        const ratingB = b.courseRatings?.length ? b.courseRatings.reduce((s, r) => s + (r.rating || 0), 0) / b.courseRatings.length : 0;
        return ratingB - ratingA;
      });
      default: return sorted;
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
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <Skeleton variant="heading" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState title="Something went wrong" description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Browse Courses</h1>
                <p className="text-muted-foreground mt-1">
                  {searchTerm
                    ? `Results for "${searchTerm}"`
                    : 'Discover courses that match your interests'}
                </p>
              </div>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'default', label: 'Sort By' },
                    { value: 'price-asc', label: 'Price: Low to High' },
                    { value: 'price-desc', label: 'Price: High to Low' },
                    { value: 'title-asc', label: 'Title: A to Z' },
                    { value: 'title-desc', label: 'Title: Z to A' },
                    { value: 'rating', label: 'Rating: High to Low' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Course Grid */}
          {sortedCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCourses.map((course, index) => (
                  <CourseCard key={course._id || index} course={course} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10 pb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                          page === i + 1
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={searchTerm ? `No courses found for "${searchTerm}"` : "No courses available"}
              description={searchTerm ? "Try a different search term" : "Check back later for new courses"}
              action={
                searchTerm ? (
                  <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setPage(1); }}>
                    Clear Search
                  </Button>
                ) : null
              }
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CoursesList;
