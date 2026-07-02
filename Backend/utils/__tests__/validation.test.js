import {
  validateEmail,
  validatePassword,
  updateLoginAttempts,
  isUserLockedOut,
  getRemainingLockoutTime,
  validateCourseData
} from '../validation.js';

describe('validateEmail', () => {
  test('should return true for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
  });

  test('should return false for invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test..test@example.com')).toBe(false);
  });

  test('should return false for empty or null values', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

describe('validatePassword', () => {
  test('should return true for passwords with 6 or more characters', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('password123')).toBe(true);
    expect(validatePassword('verylongpassword')).toBe(true);
  });

  test('should return false for passwords with less than 6 characters', () => {
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('abc')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  test('should return false for null or undefined values', () => {
    expect(validatePassword(null)).toBe(false);
    expect(validatePassword(undefined)).toBe(false);
  });
});

describe('updateLoginAttempts', () => {
  let loginAttempts;

  beforeEach(() => {
    loginAttempts = new Map();
  });

  test('should delete key on successful login', () => {
    const key = 'test@example.com';
    loginAttempts.set(key, { count: 3, lockUntil: 0 });
    
    updateLoginAttempts(loginAttempts, key, true);
    
    expect(loginAttempts.has(key)).toBe(false);
  });

  test('should increment failed attempts', () => {
    const key = 'test@example.com';
    
    updateLoginAttempts(loginAttempts, key, false);
    
    const attempt = loginAttempts.get(key);
    expect(attempt.count).toBe(1);
    expect(attempt.lockUntil).toBe(0);
  });

  test('should lock user after max attempts', () => {
    const key = 'test@example.com';
    
    // Add 4 failed attempts
    for (let i = 0; i < 4; i++) {
      updateLoginAttempts(loginAttempts, key, false);
    }
    
    const attempt = loginAttempts.get(key);
    expect(attempt.count).toBe(4);
    expect(attempt.lockUntil).toBe(0);
    
    // 5th attempt should trigger lockout
    updateLoginAttempts(loginAttempts, key, false);
    
    const lockedAttempt = loginAttempts.get(key);
    expect(lockedAttempt.count).toBe(0);
    expect(lockedAttempt.lockUntil).toBeGreaterThan(Date.now());
  });

  test('should handle custom max attempts and lockout time', () => {
    const key = 'test@example.com';
    const customMaxAttempts = 3;
    const customLockoutTime = 5 * 60 * 1000; // 5 minutes
    
    // Add 2 failed attempts
    for (let i = 0; i < 2; i++) {
      updateLoginAttempts(loginAttempts, key, false, customMaxAttempts, customLockoutTime);
    }
    
    // 3rd attempt should trigger lockout
    updateLoginAttempts(loginAttempts, key, false, customMaxAttempts, customLockoutTime);
    
    const lockedAttempt = loginAttempts.get(key);
    expect(lockedAttempt.count).toBe(0);
    expect(lockedAttempt.lockUntil).toBeGreaterThan(Date.now());
  });
});

describe('isUserLockedOut', () => {
  let loginAttempts;

  beforeEach(() => {
    loginAttempts = new Map();
  });

  test('should return false for non-existent key', () => {
    expect(isUserLockedOut(loginAttempts, 'nonexistent@example.com')).toBe(false);
  });

  test('should return false when user is not locked out', () => {
    const key = 'test@example.com';
    loginAttempts.set(key, { count: 2, lockUntil: 0 });
    
    expect(isUserLockedOut(loginAttempts, key)).toBe(false);
  });

  test('should return true when user is locked out', () => {
    const key = 'test@example.com';
    const lockUntil = Date.now() + 60000; // Lock for 1 minute
    loginAttempts.set(key, { count: 0, lockUntil });
    
    expect(isUserLockedOut(loginAttempts, key)).toBe(true);
  });

  test('should return false when lockout has expired', () => {
    const key = 'test@example.com';
    const lockUntil = Date.now() - 60000; // Lock expired 1 minute ago
    loginAttempts.set(key, { count: 0, lockUntil });
    
    expect(isUserLockedOut(loginAttempts, key)).toBe(false);
  });
});

describe('getRemainingLockoutTime', () => {
  let loginAttempts;

  beforeEach(() => {
    loginAttempts = new Map();
  });

  test('should return 0 for non-existent key', () => {
    expect(getRemainingLockoutTime(loginAttempts, 'nonexistent@example.com')).toBe(0);
  });

  test('should return 0 when user is not locked out', () => {
    const key = 'test@example.com';
    loginAttempts.set(key, { count: 2, lockUntil: 0 });
    
    expect(getRemainingLockoutTime(loginAttempts, key)).toBe(0);
  });

  test('should return remaining time in minutes when user is locked out', () => {
    const key = 'test@example.com';
    const lockUntil = Date.now() + 120000; // Lock for 2 minutes
    loginAttempts.set(key, { count: 0, lockUntil });
    
    const remainingTime = getRemainingLockoutTime(loginAttempts, key);
    expect(remainingTime).toBeGreaterThan(0);
    expect(remainingTime).toBeLessThanOrEqual(2);
  });

  test('should return 0 when lockout has expired', () => {
    const key = 'test@example.com';
    const lockUntil = Date.now() - 60000; // Lock expired 1 minute ago
    loginAttempts.set(key, { count: 0, lockUntil });
    
    expect(getRemainingLockoutTime(loginAttempts, key)).toBe(0);
  });
});

describe('validateCourseData', () => {
  test('should return valid for correct course data', () => {
    const courseData = {
      courseTitle: 'JavaScript Fundamentals',
      courseDescription: 'Learn the basics of JavaScript programming language',
      coursePrice: 99.99,
      courseThumbnail: 'https://example.com/thumbnail.jpg'
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should return invalid for missing course title', () => {
    const courseData = {
      courseDescription: 'Learn the basics of JavaScript programming language',
      coursePrice: 99.99,
      courseThumbnail: 'https://example.com/thumbnail.jpg'
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Course title must be at least 3 characters long');
  });

  test('should return invalid for short course title', () => {
    const courseData = {
      courseTitle: 'JS',
      courseDescription: 'Learn the basics of JavaScript programming language',
      coursePrice: 99.99,
      courseThumbnail: 'https://example.com/thumbnail.jpg'
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Course title must be at least 3 characters long');
  });

  test('should return invalid for missing course description', () => {
    const courseData = {
      courseTitle: 'JavaScript Fundamentals',
      coursePrice: 99.99,
      courseThumbnail: 'https://example.com/thumbnail.jpg'
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Course description must be at least 10 characters long');
  });

  test('should return invalid for short course description', () => {
    const courseData = {
      courseTitle: 'JavaScript Fundamentals',
      courseDescription: 'Short',
      coursePrice: 99.99,
      courseThumbnail: 'https://example.com/thumbnail.jpg'
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Course description must be at least 10 characters long');
  });

  test('should return invalid for negative course price', () => {
    const courseData = {
      courseTitle: 'JavaScript Fundamentals',
      courseDescription: 'Learn the basics of JavaScript programming language',
      coursePrice: -50,
      courseThumbnail: 'https://example.com/thumbnail.jpg'
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Course price must be a positive number');
  });

  test('should return invalid for missing course thumbnail', () => {
    const courseData = {
      courseTitle: 'JavaScript Fundamentals',
      courseDescription: 'Learn the basics of JavaScript programming language',
      coursePrice: 99.99
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Course thumbnail is required');
  });

  test('should return multiple errors for multiple issues', () => {
    const courseData = {
      courseTitle: 'JS',
      courseDescription: 'Short',
      coursePrice: -50
    };
    
    const result = validateCourseData(courseData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(4);
    expect(result.errors).toContain('Course title must be at least 3 characters long');
    expect(result.errors).toContain('Course description must be at least 10 characters long');
    expect(result.errors).toContain('Course price must be a positive number');
    expect(result.errors).toContain('Course thumbnail is required');
  });
}); 