import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId === 'your_razorpay_key_id_here') {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createOrder = async (studentId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
  }

  const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
  if (existingEnrollment) {
    throw new AppError('Already enrolled in this course', 400, 'ALREADY_ENROLLED');
  }

  const rzp = getRazorpay();

  if (!rzp) {
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      paymentId: 'dev_mode',
      orderId: 'dev_mode',
      amount: course.coursePrice,
      status: 'completed',
      progress: [],
    });

    course.enrolledStudents.push(studentId);
    await course.save();

    return { devMode: true, enrollment, message: 'Enrolled successfully (dev mode — no payment processed)' };
  }

  const amountInPaise = Math.round(course.coursePrice * 100);
  const order = await rzp.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_${courseId}_${studentId}`,
    notes: { courseId: course._id.toString(), studentId: studentId.toString() },
  });

  await Payment.create({
    studentId,
    courseId,
    razorpayOrderId: order.id,
    amount: course.coursePrice,
    currency: 'INR',
    status: 'created',
  });

  return { devMode: false, orderId: order.id, amount: amountInPaise, currency: 'INR', key: process.env.RAZORPAY_KEY_ID };
};

export const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: 'failed', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature }
    );
    throw new AppError('Invalid payment signature', 400, 'PAYMENT_INVALID_SIGNATURE');
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) {
    throw new AppError('Payment record not found', 404, 'PAYMENT_NOT_FOUND');
  }

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = 'paid';
  await payment.save();

  const existingEnrollment = await Enrollment.findOne({
    studentId: payment.studentId,
    courseId: payment.courseId,
  });

  if (existingEnrollment) {
    return { message: 'Already enrolled', enrollment: existingEnrollment };
  }

  const enrollment = await Enrollment.create({
    studentId: payment.studentId,
    courseId: payment.courseId,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    amount: payment.amount,
    status: 'completed',
    progress: [],
  });

  await Course.findByIdAndUpdate(payment.courseId, {
    $addToSet: { enrolledStudents: payment.studentId },
  });

  await User.findByIdAndUpdate(payment.studentId, {
    $addToSet: { enrolledCourses: payment.courseId },
  });

  return { message: 'Payment verified and enrollment successful', enrollment };
};
