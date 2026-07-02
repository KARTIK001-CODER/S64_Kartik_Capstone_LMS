import asyncHandler from 'express-async-handler';
import * as studentService from '../services/studentService.js';
import User from '../models/User.js';
import * as certificateService from '../services/certificateService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await studentService.getDashboardData(req.user._id);
  res.json(data);
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const dashboardData = await studentService.getDashboardData(req.user._id);
  const certificates = await certificateService.getStudentCertificates(req.user._id);

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      joinedAt: user.createdAt,
    },
    statistics: dashboardData.statistics,
    certificates,
  });
});
