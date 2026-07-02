import asyncHandler from 'express-async-handler';
import * as certificateService from '../services/certificateService.js';

export const generateCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.generateCertificate(req.user._id, req.params.courseId);
  res.status(201).json(certificate);
});

export const getCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificate(req.user._id, req.params.courseId);
  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }
  res.json(certificate);
});

export const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await certificateService.getStudentCertificates(req.user._id);
  res.json(certificates);
});

export const downloadCertificate = asyncHandler(async (req, res) => {
  const { buffer, filename } = await certificateService.downloadCertificate(req.params.certificateId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
