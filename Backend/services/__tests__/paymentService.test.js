import { jest } from '@jest/globals';

process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';

const mockCourseFindById = jest.fn();
const mockCourseFindByIdAndUpdate = jest.fn();
const mockEnrollmentFindOne = jest.fn();
const mockEnrollmentCreate = jest.fn();
const mockPaymentCreate = jest.fn();
const mockPaymentFindOne = jest.fn();
const mockPaymentFindOneAndUpdate = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockRazorpayOrdersCreate = jest.fn();

jest.unstable_mockModule('../../models/Course.js', () => ({
  default: {
    findById: mockCourseFindById,
    findByIdAndUpdate: mockCourseFindByIdAndUpdate,
  },
}));

jest.unstable_mockModule('../../models/Enrollment.js', () => ({
  default: {
    findOne: mockEnrollmentFindOne,
    create: mockEnrollmentCreate,
  },
}));

jest.unstable_mockModule('../../models/Payment.js', () => ({
  default: {
    create: mockPaymentCreate,
    findOne: mockPaymentFindOne,
    findOneAndUpdate: mockPaymentFindOneAndUpdate,
  },
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
  },
}));

jest.unstable_mockModule('razorpay', () => ({
  default: jest.fn(() => ({
    orders: { create: mockRazorpayOrdersCreate },
  })),
}));

const paymentService = await import('../paymentService.js');

describe('paymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    test('should throw 404 when course not found', async () => {
      mockCourseFindById.mockResolvedValue(null);

      await expect(paymentService.createOrder('s1', 'c1'))
        .rejects.toThrow('Course not found');
    });

    test('should throw 400 when already enrolled', async () => {
      mockCourseFindById.mockResolvedValue({ _id: 'c1', coursePrice: 100 });
      mockEnrollmentFindOne.mockResolvedValue({ _id: 'existing' });

      await expect(paymentService.createOrder('s1', 'c1'))
        .rejects.toThrow('Already enrolled');
    });

    test('should create dev mode enrollment when no Razorpay keys', async () => {
      const originalKeyId = process.env.RAZORPAY_KEY_ID;
      const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
      process.env.RAZORPAY_KEY_ID = 'your_razorpay_key_id_here';
      process.env.RAZORPAY_KEY_SECRET = 'your_razorpay_key_id_here';

      const course = { _id: 'c1', coursePrice: 100, enrolledStudents: [], save: jest.fn() };
      mockCourseFindById.mockResolvedValue(course);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentCreate.mockResolvedValue({
        studentId: 's1',
        courseId: 'c1',
        status: 'completed',
      });

      const result = await paymentService.createOrder('s1', 'c1');

      expect(result.devMode).toBe(true);
      expect(course.save).toHaveBeenCalled();

      process.env.RAZORPAY_KEY_ID = originalKeyId;
      process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    });

    test('should create Razorpay order when keys are set', async () => {
      mockCourseFindById.mockResolvedValue({ _id: 'c1', coursePrice: 100 });
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockRazorpayOrdersCreate.mockResolvedValue({ id: 'order_1' });
      mockPaymentCreate.mockResolvedValue({});

      const result = await paymentService.createOrder('s1', 'c1');

      expect(result.devMode).toBe(false);
      expect(result.orderId).toBe('order_1');
      expect(mockPaymentCreate).toHaveBeenCalled();
    });

    test('should set devMode=true when Rzorpay key is placeholder', async () => {
      const originalKeyId = process.env.RAZORPAY_KEY_ID;
      const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
      process.env.RAZORPAY_KEY_ID = 'your_razorpay_key_id_here';
      process.env.RAZORPAY_KEY_SECRET = 'your_razorpay_key_id_here';

      const course = { _id: 'c1', coursePrice: 100, enrolledStudents: [], save: jest.fn() };
      mockCourseFindById.mockResolvedValue(course);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentCreate.mockResolvedValue({
        studentId: 's1',
        courseId: 'c1',
        status: 'completed',
      });

      const result = await paymentService.createOrder('s1', 'c1');

      expect(result.devMode).toBe(true);
      expect(course.save).toHaveBeenCalled();

      process.env.RAZORPAY_KEY_ID = originalKeyId;
      process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    });
  });

  describe('verifyPayment', () => {
    test('should throw 400 on invalid signature', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'test_secret';

      mockPaymentFindOneAndUpdate.mockResolvedValue({});

      await expect(paymentService.verifyPayment({
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'invalid',
      })).rejects.toThrow('Invalid payment signature');

      expect(mockPaymentFindOneAndUpdate).toHaveBeenCalled();
    });

    test('should throw 404 when payment record not found after signature check', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'test_secret';
      const crypto = await import('crypto');
      const body = 'order_1|pay_1';
      const validSignature = crypto
        .createHmac('sha256', 'test_secret')
        .update(body)
        .digest('hex');

      mockPaymentFindOne.mockResolvedValue(null);

      await expect(paymentService.verifyPayment({
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: validSignature,
      })).rejects.toThrow('Payment record not found');
    });

    test('should verify and create enrollment on success', async () => {
      process.env.RAZORPAY_KEY_SECRET = 'test_secret';
      const crypto = await import('crypto');
      const body = 'order_1|pay_1';
      const validSignature = crypto
        .createHmac('sha256', 'test_secret')
        .update(body)
        .digest('hex');

      const payment = {
        _id: 'pay1',
        studentId: 's1',
        courseId: 'c1',
        amount: 100,
        status: 'created',
        save: jest.fn().mockResolvedValue({}),
      };

      mockPaymentFindOne.mockResolvedValue(payment);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentCreate.mockResolvedValue({
        studentId: 's1',
        courseId: 'c1',
        status: 'completed',
      });
      mockCourseFindByIdAndUpdate.mockResolvedValue({});
      mockUserFindByIdAndUpdate.mockResolvedValue({});

      const result = await paymentService.verifyPayment({
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: validSignature,
      });

      expect(result.enrollment.status).toBe('completed');
      expect(payment.status).toBe('paid');
      expect(payment.save).toHaveBeenCalled();
    });
  });
});
