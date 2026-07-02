import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS API',
      version: '1.0.0',
      description: 'Learning Management System REST API — course management, enrollment, payments, certificates, notifications, and educator analytics.',
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
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['student', 'educator'] },
            avatar: { type: 'string' },
            headline: { type: 'string' },
            bio: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            courseTitle: { type: 'string' },
            courseSubtitle: { type: 'string' },
            courseDescription: { type: 'string' },
            coursePrice: { type: 'number' },
            courseThumbnail: { type: 'string' },
            isPublished: { type: 'boolean' },
            discount: { type: 'number' },
            category: { type: 'string' },
            difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] },
            language: { type: 'string' },
            educator: { $ref: '#/components/schemas/User' },
            courseContent: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  lectures: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        videoUrl: { type: 'string' },
                        duration: { type: 'number' },
                        isPreviewFree: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
            enrolledStudents: { type: 'array', items: { type: 'string' } },
            courseRatings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  student: { type: 'string' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  review: { type: 'string' },
                  reply: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            courseId: { $ref: '#/components/schemas/Course' },
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
            courseCompleted: { type: 'boolean' },
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
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', enum: ['system', 'enrollment', 'review', 'completion'] },
            link: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            courseId: { $ref: '#/components/schemas/Course' },
            studentName: { type: 'string' },
            courseName: { type: 'string' },
            certificateId: { type: 'string' },
            completedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            message: { type: 'string' },
            errorCode: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

export default swaggerJsdoc(options);
