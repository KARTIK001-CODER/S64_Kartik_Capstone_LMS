import asyncHandler from 'express-async-handler';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Course from '../models/Course.js';
import User from '../models/User.js';
import * as educatorService from '../services/educatorService.js';
import * as courseService from '../services/courseService.js';

export const getReportData = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await educatorService.getReportData(req.user._id, startDate, endDate);
  res.json(data);
});

export const exportReportCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await educatorService.getReportData(req.user._id, startDate, endDate);

  const rows = data.coursePerformance.map(c => ({
    'Course Title': c.courseTitle,
    'Enrollments': c.enrollments,
    'Completions': c.completions,
    'Completion Rate (%)': c.completionRate,
    'Revenue ($)': c.revenue.toFixed(2),
    'Average Rating': c.averageRating,
  }));

  const fields = ['Course Title', 'Enrollments', 'Completions', 'Completion Rate (%)', 'Revenue ($)', 'Average Rating'];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.attachment('analytics_report.csv');
  res.send(csv);
});

export const exportReportPDF = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await educatorService.getReportData(req.user._id, startDate, endDate);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-disposition', 'attachment; filename="analytics_report.pdf"');
  res.setHeader('Content-type', 'application/pdf');

  doc.fontSize(20).text('Analytics Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Period: ${startDate || 'All Time'} — ${endDate || 'Present'}`);
  doc.moveDown();

  doc.fontSize(14).text('Key Metrics', { underline: true });
  doc.fontSize(11).text(`Total Students: ${data.totalStudents}`);
  doc.text(`Total Courses: ${data.totalCourses}`);
  doc.text(`Total Enrollments: ${data.totalEnrollments}`);
  doc.text(`Total Revenue: $${data.totalRevenue.toFixed(2)}`);
  doc.text(`Growth Rate: ${data.growthRate}%`);
  doc.moveDown();

  doc.fontSize(14).text('Course Performance', { underline: true });
  for (const c of data.coursePerformance) {
    doc.fontSize(10).text(`${c.courseTitle}: ${c.enrollments} enrollments, ${c.completionRate}% completion, $${c.revenue.toFixed(2)} revenue, ${c.averageRating}/5 rating`);
  }

  doc.pipe(res);
  doc.end();
});

export const getLearners = asyncHandler(async (req, res) => {
  const result = await educatorService.getLearners(req.user._id, req.query);
  res.json(result);
});

export const exportLearnersCSV = asyncHandler(async (req, res) => {
  const result = await educatorService.getLearners(req.user._id, { ...req.query, limit: 10000 });
  const learners = result.learners;

  const rows = learners.map(l => ({
    'Student Name': l.student?.name || 'Unknown',
    'Email': l.student?.email || '',
    'Course': l.course?.courseTitle || '',
    'Enrolled At': new Date(l.enrolledAt).toLocaleDateString(),
    'Progress (%)': l.progressPercent || 0,
    'Completed': l.courseCompleted ? 'Yes' : 'No',
    'Completed At': l.courseCompletedAt ? new Date(l.courseCompletedAt).toLocaleDateString() : '',
  }));

  const fields = ['Student Name', 'Email', 'Course', 'Enrolled At', 'Progress (%)', 'Completed', 'Completed At'];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.attachment('learners_report.csv');
  res.send(csv);
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await educatorService.getDashboardStats(req.user._id);
  res.json(stats);
});

export const getEnrolledStudents = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const educatorId = req.user._id;

  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) {
    res.status(404);
    throw new Error('Course not found or unauthorized');
  }

  const enrolledStudents = await User.find({
    _id: { $in: course.enrolledStudents }
  }).select('name email avatar');

  res.json(enrolledStudents);
});

export const getReviews = asyncHandler(async (req, res) => {
  const { courseId, rating, page, limit } = req.query;
  const data = await educatorService.getReviews(req.user._id, { courseId, rating, page, limit });
  res.json(data);
});

export const addReviewReply = asyncHandler(async (req, res) => {
  const { courseId, ratingId } = req.params;
  const { reply } = req.body;
  if (!reply || !reply.trim()) {
    res.status(400);
    throw new Error('Reply text is required');
  }
  await courseService.addReviewReply(courseId, req.user._id, ratingId, reply.trim());
  res.json({ message: 'Reply added successfully' });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await educatorService.getProfile(req.user._id);
  res.json(user);
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await educatorService.getSettings(req.user._id);
  res.json(settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await educatorService.updateSettings(req.user._id, req.body);
  res.json(settings);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.avatar = req.file.path;
  const user = await educatorService.updateProfile(req.user._id, updates);
  res.json(user);
});
