import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS API',
      version: '1.0.0',
      description: 'Learning Management System REST API',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            courseTitle: { type: 'string' },
            courseDescription: { type: 'string' },
            coursePrice: { type: 'number' },
            courseThumbnail: { type: 'string' },
            isPublished: { type: 'boolean' },
            discount: { type: 'number' },
            educator: { type: 'string' },
            category: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            courseId: { type: 'string' },
            paymentId: { type: 'string' },
            orderId: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            progress: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lectureId: { type: 'string' },
                  completed: { type: 'boolean' },
                  completedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            enrolledAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            courseId: { type: 'string' },
            razorpayOrderId: { type: 'string' },
            razorpayPaymentId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['created', 'attempted', 'paid', 'failed'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            stack: { type: 'string' },
          },
        },
        PaginatedCourses: {
          type: 'object',
          properties: {
            courses: { type: 'array', items: { $ref: '#/components/schemas/Course' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

export default swaggerJsdoc(options);
