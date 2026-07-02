import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import CourseCard from './CourseCard';
import { SkeletonCard } from '../ui/skeleton';
import { ErrorState, EmptyState } from '../ui/empty-state';
import { Button } from '../ui/button';

const CoursesSection = ({ title, description, limit = 4 }) => {
  const { allCourses, loading, error } = useContext(AppContext);

  const sectionTitle = title || 'Learn from the best';
  const sectionDescription = description ||
    'Discover top-rated courses crafted by industry experts to help you master new skills and advance your career.';

  if (error) {
    return (
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Failed to load courses"
            description={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {sectionTitle}
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {sectionDescription}
            </p>
          </div>
          {allCourses?.length > limit && (
            <Link
              to="/courses-list"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
            >
              View all courses
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {/* Course cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : allCourses && allCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allCourses.slice(0, limit).map((course, index) => (
              <CourseCard key={course._id || index} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses available"
            description="We're working on adding new courses. Check back soon!"
          />
        )}

        {allCourses?.length > limit && (
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/courses-list'}
            >
              Browse all courses
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;
