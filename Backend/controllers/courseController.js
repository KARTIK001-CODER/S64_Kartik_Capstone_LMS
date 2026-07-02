import asyncHandler from 'express-async-handler';
import * as courseService from '../services/courseService.js';

export const addCourse = asyncHandler(async (req, res) => {
  const educator = req.user._id || req.user.id;
  const course = await courseService.createCourse({ educator, body: req.body, file: req.file });
  res.status(201).json(course);
});

export const getCourses = asyncHandler(async (req, res) => {
  const result = await courseService.listCourses(req.query);
  res.json(result);
});

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);
  res.json(course);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse({
    courseId: req.params.id,
    userId: req.user._id,
    body: req.body,
    file: req.file,
  });
  res.json(course);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const result = await courseService.deleteCourse(req.params.id, req.user._id);
  res.json(result);
});

export const addCourseRating = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const course = await courseService.addRating(req.params.id, req.user._id, rating, review);
  res.json(course);
});

export const getEducatorCourses = asyncHandler(async (req, res) => {
  const result = await courseService.listEducatorCourses(req.user._id, req.query);
  res.json(result);
});
