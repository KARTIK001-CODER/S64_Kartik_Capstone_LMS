import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import {
  updateLoginAttempts,
  isUserLockedOut,
  getRemainingLockoutTime,
} from '../utils/validation.js';

const loginAttempts = new Map();

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists', errorCode: 'USER_EXISTS' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const savedUser = await User.create({ name, email, password: hashedPassword, role });

    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role, name: savedUser.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      user: { _id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error during registration');
    res.status(500).json({ success: false, message: 'Something went wrong', errorCode: 'INTERNAL_ERROR' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || 'unknown';
  const key = `${ip}:${email}`;

  if (isUserLockedOut(loginAttempts, key)) {
    const remainingMinutes = getRemainingLockoutTime(loginAttempts, key);
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Try again in ${remainingMinutes} minutes.`,
      errorCode: 'RATE_LIMIT',
    });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      updateLoginAttempts(loginAttempts, key, false);
      return res.status(401).json({ success: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      updateLoginAttempts(loginAttempts, key, false);
      return res.status(401).json({ success: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });
    }

    updateLoginAttempts(loginAttempts, key, true);

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error during login');
    res.status(500).json({ success: false, message: 'Something went wrong', errorCode: 'INTERNAL_ERROR' });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token is required', errorCode: 'TOKEN_REQUIRED' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', errorCode: 'USER_NOT_FOUND' });
    }

    const newToken = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.json({ success: true, token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please log in again.', errorCode: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid refresh token', errorCode: 'INVALID_TOKEN' });
  }
};
