import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Star, Bookmark, Play } from 'lucide-react';
import { Badge } from '../ui/badge';

const CourseCard = ({ course }) => {
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const calculateRating = () => {
    if (!course.courseRatings || course.courseRatings.length === 0) return 0;
    const sum = course.courseRatings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / course.courseRatings.length;
  };

  const rating = calculateRating();
  const reviewCount = course.courseRatings?.length || 0;
  const discountedPrice = course.discount
    ? (course.coursePrice - (course.discount * course.coursePrice) / 100).toFixed(2)
    : (course.coursePrice || 0).toFixed(2);

  const getEducatorName = () => {
    if (course.educator) {
      return course.educator.name || 'Instructor';
    }
    return 'Instructor';
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop';

  // Calculate total duration
  const totalDuration = course.courseContent?.reduce((acc, ch) => {
    const lectures = ch.lectures || ch.chapterContent || [];
    return acc + lectures.reduce((sum, l) => sum + (l.duration || l.lectureDuration || 0), 0);
  }, 0) || 0;

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="inline-flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={12} className="fill-warning text-warning" />
        ))}
        {hasHalfStar && (
          <span className="relative">
            <Star size={12} className="text-neutral-300 dark:text-neutral-600" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star size={12} className="fill-warning text-warning" />
            </span>
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={12} className="text-neutral-300 dark:text-neutral-600" />
        ))}
      </span>
    );
  };

  return (
    <Link
      to={`/courses/${course._id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={imgError ? defaultThumbnail : (course.courseThumbnail || defaultThumbnail)}
          alt={course.courseTitle}
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="h-12 w-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Play size={20} className="text-primary ml-0.5" />
            </div>
          </div>
        </div>
        {/* Discount badge */}
        {course.discount > 0 && (
          <Badge variant="error" size="sm" className="absolute top-3 left-3">
            {course.discount}% OFF
          </Badge>
        )}
        {/* Bookmark */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setBookmarked(!bookmarked);
          }}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
        >
          <Bookmark
            size={14}
            className={bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {course.courseTitle}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {getEducatorName()}
          </p>

          {/* Rating row */}
          <div className="flex items-center gap-2 mb-3">
            {renderStars()}
            <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(totalDuration)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {course.enrolledStudents?.length || 0}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">${discountedPrice}</span>
            {course.discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                ${course.coursePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
