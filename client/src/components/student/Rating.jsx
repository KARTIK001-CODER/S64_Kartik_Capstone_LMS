import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const Rating = ({ initialRating, onRate }) => {
  const [rating, setRating] = useState(initialRating || 0);
  const [hover, setHover] = useState(0);

  const handleRating = (value) => {
    setRating(value);
    if (onRate) onRate(value);
  };

  useEffect(() => {
    if (initialRating) setRating(initialRating);
  }, [initialRating]);

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= (hover || rating);
        return (
          <button
            key={index}
            type="button"
            className="p-0.5 transition-all duration-100 hover:scale-110"
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRating(starValue)}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={18}
              className={`transition-colors duration-100 ${
                filled
                  ? 'fill-warning text-warning'
                  : 'text-neutral-300 dark:text-neutral-600'
              }`}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="text-xs text-muted-foreground ml-2">{rating}/5</span>
      )}
    </div>
  );
};

export default Rating;
