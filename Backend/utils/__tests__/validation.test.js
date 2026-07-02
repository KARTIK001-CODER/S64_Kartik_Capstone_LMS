import {
  validateEmail,
  validatePassword,
  updateLoginAttempts,
  isUserLockedOut,
  getRemainingLockoutTime,
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
  test('should return true for strong passwords', () => {
    expect(validatePassword('Str0ng!Pass')).toBe(true);
    expect(validatePassword('Abcdef1!xyz')).toBe(true);
    expect(validatePassword('P@ssw0rdLong')).toBe(true);
  });

  test('should return false for passwords with less than 8 characters', () => {
    expect(validatePassword('Abc1!x')).toBe(false);
    expect(validatePassword('Sh0r!')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  test('should return false if missing required character types', () => {
    expect(validatePassword('nouppercase1!')).toBe(false);
    expect(validatePassword('NOLOWERCASE1!')).toBe(false);
    expect(validatePassword('NoNumber!!')).toBe(false);
    expect(validatePassword('NoSpecial1a')).toBe(false);
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

    for (let i = 0; i < 4; i++) {
      updateLoginAttempts(loginAttempts, key, false);
    }

    const attempt = loginAttempts.get(key);
    expect(attempt.count).toBe(4);
    expect(attempt.lockUntil).toBe(0);

    updateLoginAttempts(loginAttempts, key, false);

    const lockedAttempt = loginAttempts.get(key);
    expect(lockedAttempt.count).toBe(0);
    expect(lockedAttempt.lockUntil).toBeGreaterThan(Date.now());
  });

  test('should handle custom max attempts and lockout time', () => {
    const key = 'test@example.com';
    const customMaxAttempts = 3;
    const customLockoutTime = 5 * 60 * 1000;

    for (let i = 0; i < 2; i++) {
      updateLoginAttempts(loginAttempts, key, false, customMaxAttempts, customLockoutTime);
    }

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
    const lockUntil = Date.now() + 60000;
    loginAttempts.set(key, { count: 0, lockUntil });

    expect(isUserLockedOut(loginAttempts, key)).toBe(true);
  });

  test('should return false when lockout has expired', () => {
    const key = 'test@example.com';
    const lockUntil = Date.now() - 60000;
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
    const lockUntil = Date.now() + 120000;
    loginAttempts.set(key, { count: 0, lockUntil });

    const remainingTime = getRemainingLockoutTime(loginAttempts, key);
    expect(remainingTime).toBeGreaterThan(0);
    expect(remainingTime).toBeLessThanOrEqual(2);
  });

  test('should return 0 when lockout has expired', () => {
    const key = 'test@example.com';
    const lockUntil = Date.now() - 60000;
    loginAttempts.set(key, { count: 0, lockUntil });

    expect(getRemainingLockoutTime(loginAttempts, key)).toBe(0);
  });
});
