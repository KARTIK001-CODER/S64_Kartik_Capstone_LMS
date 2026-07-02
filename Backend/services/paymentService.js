import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const getRazorpay = () => {
  if (!razorpayKeyId || !razorpayKeySecret || razorpayKeyId === 'your_razorpay_key_id_here') {
    return null;
  }
  return new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
};

export const createOrder = async (studentId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
  if (existingEnrollment) {
    const err = new Error('Already enrolled in this course');
    err.statusCode = 400;
    throw err;
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

  return { devMode: false, orderId: order.id, amount: amountInPaise, currency: 'INR', key: razorpayKeyId };
};

export const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: 'failed', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature }
    );
    const err = new Error('Invalid payment signature');
    err.statusCode = 400;
    throw err;
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) {
    const err = new Error('Payment record not found');
    err.statusCode = 404;
    throw err;
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
