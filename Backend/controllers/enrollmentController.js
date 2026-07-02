import asyncHandler from 'express-async-handler';
import * as enrollmentService from '../services/enrollmentService.js';

export const getEnrolledCourses = asyncHandler(async (req, res) => {
  const enrollments = await enrollmentService.listEnrolledCourses(req.user._id);
  res.json(enrollments);
});

export const enrollCourse = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.enroll(req.user._id, req.params.courseId, req.body);
  res.status(201).json(enrollment);
});

export const getCourseProgress = asyncHandler(async (req, res) => {
  const result = await enrollmentService.getProgress(req.user._id, req.params.courseId);
  res.json(result);
});

export const updateCourseProgress = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.updateProgress(req.user._id, req.params.courseId, req.body.lectureId);
  res.json(enrollment);
});

export const updateLastWatched = asyncHandler(async (req, res) => {
  const { lectureId, chapterIndex, lectureIndex } = req.body;
  const result = await enrollmentService.updateLastWatched(req.user._id, req.params.courseId, { lectureId, chapterIndex, lectureIndex });
  res.json(result);
});
