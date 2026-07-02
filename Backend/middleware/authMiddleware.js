import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.header('Authorization');
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        error: 'AUTH_NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error',
        error: 'AUTH_CONFIG_ERROR'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ 
        message: 'Token has expired',
        error: 'AUTH_TOKEN_EXPIRED'
      });
    }

    // Set user object with _id instead of id
    req.user = {
      ...decoded,
      _id: decoded.id || decoded._id // Handle both id and _id
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'AUTH_INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        error: 'AUTH_TOKEN_EXPIRED'
      });
    }

    res.status(500).json({ 
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

const educatorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'educator') {
    return res.status(403).json({
      message: 'Access denied. Educator role required.',
      error: 'AUTH_EDUCATOR_ONLY'
    });
  }
  next();
};

export { protect, educatorOnly };