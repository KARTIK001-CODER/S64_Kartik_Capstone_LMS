import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Course from '../models/Course.js';
import User from '../models/User.js';
import * as educatorService from '../services/educatorService.js';
import * as courseService from '../services/courseService.js';

export const getReportData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await educatorService.getReportData(req.user._id, startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ message: 'Error fetching report data' });
  }
};

export const exportReportCSV = async (req, res) => {
  try {
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
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting CSV' });
  }
};

export const exportReportPDF = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Error exporting PDF' });
  }
};

export const getLearners = async (req, res) => {
  try {
    const result = await educatorService.getLearners(req.user._id, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching learners:', error);
    res.status(500).json({ message: 'Error fetching learners' });
  }
};

export const exportLearnersCSV = async (req, res) => {
  try {
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
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting CSV' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await educatorService.getDashboardStats(req.user._id);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

// Get enrolled students for a course
export const getEnrolledStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        const educatorId = req.user._id;

        // Check if course exists and belongs to the educator
        const course = await Course.findOne({
            _id: courseId,
            educator: educatorId
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        // Get enrolled students with their details
        const enrolledStudents = await User.find({
            _id: { $in: course.enrolledStudents }
        }).select('name email avatar');

        res.status(200).json(enrolledStudents);
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        res.status(500).json({ message: 'Error fetching enrolled students' });
    }
};

export const getReviews = async (req, res) => {
  try {
    const { courseId, rating, page, limit } = req.query;
    const data = await educatorService.getReviews(req.user._id, { courseId, rating, page, limit });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const addReviewReply = async (req, res) => {
  try {
    const { courseId, ratingId } = req.params;
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }
    await courseService.addReviewReply(courseId, req.user._id, ratingId, reply.trim());
    res.status(200).json({ message: 'Reply added successfully' });
  } catch (error) {
    console.error('Error adding reply:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Error adding reply' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await educatorService.getProfile(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await educatorService.getSettings(req.user._id);
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = await educatorService.updateSettings(req.user._id, req.body);
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.avatar = req.file.path;
    const user = await educatorService.updateProfile(req.user._id, updates);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Error updating profile' });
  }
}; 