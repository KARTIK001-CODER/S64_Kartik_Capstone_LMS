import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../../assets/assets';

const CourseCard = ({ course }) => {
  const [imgError, setImgError] = useState(false);
  // Calculate average rating from courseRatings array
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

  // Get educator name from the course data
  const getEducatorName = () => {
    if (course.educator) {
      return course.educator.name || 'Unknown Educator';
    }
    return 'Unknown Educator';
  };

  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex mr-2">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <Link
      to={`/courses/${course._id}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Course Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          src={imgError ? assets.course_1_thumbnail : (course.courseThumbnail || assets.course_1_thumbnail)}
          alt={course.courseTitle}
          onError={() => setImgError(true)}
        />
        {course.discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {course.discount}% OFF
          </div>
        )}
      </div>
      
      {/* Course Details */}
      <div className="flex-1 p-4 flex flex-col justify-between text-left">
        <div>
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2 mb-1">
            {course.courseTitle}
          </h3>
          <p className="text-gray-600 text-sm mb-2 flex items-center">
            <span className="inline-block mr-1">by</span> 
            <span className="font-medium">{getEducatorName()}</span>
          </p>
        </div>
        
        {/* Rating and Price Section */}
        <div className="mt-2">
          {/* Rating */}
          <div className="flex items-center mb-2">
            {renderStars()}
            <p className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</p>
            <span className="mx-2 text-gray-400">•</span>
            <p className="text-sm text-gray-500">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>
          
          {/* Price */}
          <div className="mt-3 flex items-center">
            <p className="text-xl font-bold text-indigo-600">
              ${discountedPrice}
            </p>
            {course.discount > 0 && (
              <span className="line-through text-gray-400 text-sm ml-2">
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