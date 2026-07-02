import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const protect = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        errorCode: 'AUTH_NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        errorCode: 'AUTH_CONFIG_ERROR'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errorCode: 'AUTH_USER_NOT_FOUND'
      });
    }

    req.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        errorCode: 'AUTH_INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        errorCode: 'AUTH_TOKEN_EXPIRED'
      });
    }

    logger.error({ err: error }, 'Auth middleware error');
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      errorCode: 'AUTH_ERROR'
    });
  }
};

const educatorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'educator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Educator role required.',
      errorCode: 'AUTH_EDUCATOR_ONLY'
    });
  }
  next();
};

const verifyOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          errorCode: 'RESOURCE_NOT_FOUND'
        });
      }

      const ownerField = resource.educator || resource.userId || resource.studentId;
      if (ownerField && ownerField.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource',
          errorCode: 'AUTH_NOT_OWNER'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
    logger.error({ err: error }, 'Ownership verification error');
    res.status(500).json({
        success: false,
        message: 'Error verifying ownership',
        errorCode: 'AUTH_OWNERSHIP_ERROR'
      });
    }
  };
};

export { protect, educatorOnly, verifyOwnership };
