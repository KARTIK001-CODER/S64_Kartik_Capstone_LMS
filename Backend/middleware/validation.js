import { body, param, query, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const passwordRules = body('password')
  .isString().withMessage('Password must be a string')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/\d/).withMessage('Password must contain a number')
  .matches(/[^a-zA-Z\d]/).withMessage('Password must contain a special character');

export const registerValidation = [
  body('name').trim().isString().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRules,
  body('role').trim().isIn(['student', 'educator']).withMessage('Role must be student or educator'),
  handleValidationErrors,
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().withMessage('Password is required').notEmpty().withMessage('Password cannot be empty'),
  handleValidationErrors,
];

export const courseValidation = [
  body('courseTitle').trim().isString().withMessage('Course title is required').isLength({ min: 3, max: 200 }).withMessage('Course title must be 3-200 characters'),
  body('courseDescription').trim().isString().withMessage('Course description is required').isLength({ min: 10 }).withMessage('Course description must be at least 10 characters'),
  body('coursePrice').isFloat({ min: 0 }).withMessage('Course price must be a positive number'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
  body('category').optional().trim().isString().withMessage('Category must be a string'),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid difficulty level'),
  body('language').optional().trim().isString().withMessage('Language must be a string'),
  handleValidationErrors,
];

export const ratingValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('review').optional().trim().isString().withMessage('Review must be a string'),
  handleValidationErrors,
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  handleValidationErrors,
];

export const objectIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

export const courseIdValidation = [
  param('courseId').isMongoId().withMessage('Invalid course ID format'),
  handleValidationErrors,
];

export const notificationValidation = [
  body('title').trim().isString().withMessage('Title is required').isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('message').trim().isString().withMessage('Message is required').isLength({ min: 1 }).withMessage('Message cannot be empty'),
  body('type').optional().isIn(['enrollment', 'review', 'completion', 'system']).withMessage('Invalid notification type'),
  handleValidationErrors,
];

export const paymentValidation = [
  body('courseId').isMongoId().withMessage('Invalid course ID'),
  handleValidationErrors,
];

export const verifyPaymentValidation = [
  body('razorpay_order_id').trim().isString().withMessage('Order ID is required').notEmpty().withMessage('Order ID cannot be empty'),
  body('razorpay_payment_id').trim().isString().withMessage('Payment ID is required').notEmpty().withMessage('Payment ID cannot be empty'),
  body('razorpay_signature').trim().isString().withMessage('Signature is required').notEmpty().withMessage('Signature cannot be empty'),
  handleValidationErrors,
];

export const profileUpdateValidation = [
  body('name').optional().trim().isString().withMessage('Name must be a string').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('headline').optional().trim().isString().withMessage('Headline must be a string').isLength({ max: 200 }).withMessage('Headline must be under 200 characters'),
  body('bio').optional().trim().isString().withMessage('Bio must be a string').isLength({ max: 2000 }).withMessage('Bio must be under 2000 characters'),
  handleValidationErrors,
];

export const reviewReplyValidation = [
  body('reply').trim().isString().withMessage('Reply is required').isLength({ min: 1 }).withMessage('Reply cannot be empty'),
  handleValidationErrors,
];

export const progressUpdateValidation = [
  body('lectureId').isMongoId().withMessage('Invalid lecture ID'),
  handleValidationErrors,
];

export const lastWatchedValidation = [
  body('lectureId').isMongoId().withMessage('Invalid lecture ID'),
  body('chapterIndex').isInt({ min: 0 }).withMessage('Chapter index must be a non-negative integer'),
  body('lectureIndex').isInt({ min: 0 }).withMessage('Lecture index must be a non-negative integer'),
  handleValidationErrors,
];
