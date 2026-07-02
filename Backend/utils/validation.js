export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  const [local] = email.split('@');
  if (local.includes('..')) return false;
  return true;
};

export const validatePassword = (password) => {
  if (!password) return false;
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^a-zA-Z\d]/.test(password)) return false;
  return true;
};

export const updateLoginAttempts = (loginAttempts, key, success, maxAttempts = 5, lockoutTime = 15 * 60 * 1000) => {
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

  if (loginAttempts.size > 100) {
    const now = Date.now();
    for (const [k, value] of loginAttempts.entries()) {
      if (value.lockUntil < now && value.count === 0) {
        loginAttempts.delete(k);
      }
    }
  }
};

export const isUserLockedOut = (loginAttempts, key) => {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;

  const now = Date.now();
  return attempt.lockUntil > now;
};

export const getRemainingLockoutTime = (loginAttempts, key) => {
  const attempt = loginAttempts.get(key);
  if (!attempt) return 0;

  const now = Date.now();
  if (attempt.lockUntil <= now) return 0;

  return Math.ceil((attempt.lockUntil - now) / 60000);
};
