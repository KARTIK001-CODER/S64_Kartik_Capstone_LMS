import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

const getFilteredStats = async (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const enrollmentFilter = {};
  if (startDate || endDate) {
    enrollmentFilter.enrolledAt = {};
    if (startDate) enrollmentFilter.enrolledAt.$gte = new Date(startDate);
    if (endDate) enrollmentFilter.enrolledAt.$lte = new Date(endDate);
  }

  const totalUsers = await User.countDocuments(filter);
  const totalCourses = await Course.countDocuments(filter);
  const totalEnrollments = await Enrollment.countDocuments({ ...enrollmentFilter, status: 'completed' });

  const revenueResult = await Enrollment.aggregate([
    { $match: { ...enrollmentFilter, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const userGrowthData = await User.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const courseStats = await Enrollment.aggregate([
    { $match: { ...enrollmentFilter, status: 'completed' } },
    {
      $group: {
        _id: '$courseId',
        enrollmentCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $project: {
        title: '$course.courseTitle',
        enrollmentCount: 1,
        category: '$course.category'
      }
    },
    { $sort: { enrollmentCount: -1 } }
  ]);

  const categoryData = await Course.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
    revenue,
    userGrowthData: userGrowthData.map(item => ({ date: item._id, count: item.count })),
    courseStats,
    categoryData: categoryData.map(item => ({ name: item._id, value: item.count }))
  };
};

export const getReportSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getFilteredStats(startDate, endDate);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getFilteredStats(startDate, endDate);

    const fields = ['title', 'enrollmentCount'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(stats.courseStats);

    res.header('Content-Type', 'text/csv');
    res.attachment('course_popularity_report.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getFilteredStats(startDate, endDate);

    const doc = new PDFDocument();
    let filename = 'report_summary.pdf';
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.fontSize(25).text('LMS Report Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`);
    doc.moveDown();

    doc.fontSize(18).text('Key Metrics:');
    doc.fontSize(14).text(`Total Users: ${stats.totalUsers}`);
    doc.text(`Total Courses: ${stats.totalCourses}`);
    doc.text(`Total Enrollments: ${stats.totalEnrollments}`);
    doc.text(`Total Revenue: $${stats.revenue.toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(18).text('Course Popularity:');
    stats.courseStats.forEach(course => {
      doc.fontSize(12).text(`${course.title}: ${course.enrollmentCount} enrollments`);
    });

    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
