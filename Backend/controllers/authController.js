import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simple in-memory rate limiting
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      {
        id: savedUser._id,
        role: savedUser.role,
        name: savedUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Don't return password in response
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role
    };

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Check for rate limiting
  const key = `${ip}:${email}`;
  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };

  // Check if user is locked out
  const now = Date.now();
  if (attempt.lockUntil > now) {
    const remainingMinutes = Math.ceil((attempt.lockUntil - now) / 60000);
    return res.status(429).json({
      message: `Too many failed login attempts. Try again in ${remainingMinutes} minutes.`
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Increment failed attempts even if user doesn't exist
      updateLoginAttempts(key, false);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      updateLoginAttempts(key, false);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset attempts on successful login
    loginAttempts.delete(key);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Don't return password in response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

function updateLoginAttempts(key, success) {
  if (success) {
    loginAttempts.delete(key);
    return;
  }

  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockUntil = Date.now() + LOCKOUT_TIME;
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
}

// New endpoint for token refresh
export const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    // Verify the existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Generate a new token
    const newToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
        name: decoded.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};