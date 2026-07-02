// Email validation function
const validateEmail = (email) => {
  if (!email) return false;
  // Disallow consecutive dots in the local part
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  const [local] = email.split('@');
  if (local.includes('..')) return false;
  return true;
};

// Password validation function
const validatePassword = (password) => {
  if (!password) return false;
  return password.length >= 6;
};

// Rate limiting utility function
const updateLoginAttempts = (loginAttempts, key, success, maxAttempts = 5, lockoutTime = 15 * 60 * 1000) => {
  if (success) {
    loginAttempts.delete(key);
    return;
  }
  
  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  attempt.count += 1;
  
  if (attempt.count >= maxAttempts) {
    attempt.lockUntil = Date.now() + lockoutTime;
    attempt.count = 0;
  }
  
  loginAttempts.set(key, attempt);
  
  // Clean up old entries periodically
  if (loginAttempts.size > 100) {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
      if (value.lockUntil < now && value.count === 0) {
        loginAttempts.delete(key);
      }
    }
  }
};

// Check if user is locked out
const isUserLockedOut = (loginAttempts, key) => {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;
  
  const now = Date.now();
  return attempt.lockUntil > now;
};

// Get remaining lockout time in minutes
const getRemainingLockoutTime = (loginAttempts, key) => {
  const attempt = loginAttempts.get(key);
  if (!attempt) return 0;
  
  const now = Date.now();
  if (attempt.lockUntil <= now) return 0;
  
  return Math.ceil((attempt.lockUntil - now) / 60000);
};

// Validate course data
const validateCourseData = (courseData) => {
  const errors = [];
  
  if (!courseData.courseTitle || courseData.courseTitle.trim().length < 3) {
    errors.push('Course title must be at least 3 characters long');
  }
  
  if (!courseData.courseDescription || courseData.courseDescription.trim().length < 10) {
    errors.push('Course description must be at least 10 characters long');
  }
  
  if (!courseData.coursePrice || courseData.coursePrice < 0) {
    errors.push('Course price must be a positive number');
  }
  
  if (!courseData.courseThumbnail) {
    errors.push('Course thumbnail is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export {
  validateEmail,
  validatePassword,
  updateLoginAttempts,
  isUserLockedOut,
  getRemainingLockoutTime,
  validateCourseData
}; 