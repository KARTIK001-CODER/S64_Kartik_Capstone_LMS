import PDFDocument from 'pdfkit';
import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

export const generateCertificate = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId, courseCompleted: true });
  if (!enrollment) {
    const err = new Error('Course not completed yet');
    err.statusCode = 400;
    throw err;
  }

  const existing = await Certificate.findOne({ studentId, courseId });
  if (existing) {
    return existing;
  }

  const course = await Course.findById(courseId);
  const student = await User.findById(studentId);

  if (!course || !student) {
    const err = new Error('Course or student not found');
    err.statusCode = 404;
    throw err;
  }

  const certificate = await Certificate.create({
    studentId,
    courseId,
    studentName: student.name,
    courseName: course.courseTitle,
    completedAt: enrollment.courseCompletedAt,
  });

  return certificate;
};

export const getCertificate = async (studentId, courseId) => {
  return Certificate.findOne({ studentId, courseId });
};

export const getStudentCertificates = async (studentId) => {
  return Certificate.find({ studentId })
    .populate('courseId', 'courseTitle courseThumbnail category')
    .sort({ createdAt: -1 });
};

export const downloadCertificate = async (certificateId) => {
  const certificate = await Certificate.findOne({ certificateId });
  if (!certificate) {
    const err = new Error('Certificate not found');
    err.statusCode = 404;
    throw err;
  }

  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  drawCertificate(doc, certificate, pageWidth, pageHeight);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(buffers),
        filename: `certificate-${certificate.certificateId}.pdf`,
      });
    });
  });
};

function drawCertificate(doc, cert, w, h) {
  const margin = 30;
  const innerW = w - margin * 2;
  const innerH = h - margin * 2;

  const borderPadding = 12;
  const outerMargin = margin - borderPadding;

  doc.rect(outerMargin, outerMargin, w - outerMargin * 2, h - outerMargin * 2).lineWidth(4).stroke('#1e40af');

  doc.rect(margin, margin, innerW, innerH).lineWidth(2).stroke('#3b82f6');

  const accentY = margin + 60;
  doc
    .moveTo(margin + 80, accentY)
    .lineTo(w - margin - 80, accentY)
    .lineWidth(1.5)
    .stroke('#93c5fd');

  doc
    .fontSize(36)
    .font('Helvetica-Bold')
    .fillColor('#1e3a5f')
    .text('CERTIFICATE', w / 2, accentY + 15, { align: 'center' });

  doc
    .fontSize(18)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('OF COMPLETION', w / 2, doc.y + 2, { align: 'center' });

  doc
    .fontSize(14)
    .font('Helvetica')
    .fillColor('#475569')
    .text('This is to certify that', w / 2, doc.y + 30, { align: 'center' });

  doc
    .fontSize(32)
    .font('Helvetica-Bold')
    .fillColor('#1e40af')
    .text(cert.studentName, w / 2, doc.y + 8, { align: 'center' });

  doc
    .fontSize(14)
    .font('Helvetica')
    .fillColor('#475569')
    .text('has successfully completed the course', w / 2, doc.y + 15, { align: 'center' });

  doc
    .fontSize(22)
    .font('Helvetica-BoldOblique')
    .fillColor('#1e3a5f')
    .text(cert.courseName, w / 2, doc.y + 10, { align: 'center' });

  const formattedDate = cert.completedAt
    ? new Date(cert.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(`Date of completion: ${formattedDate}`, w / 2, doc.y + 25, { align: 'center' });

  const bottomY = h - margin - 50;

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(`Certificate ID: ${cert.certificateId}`, w / 2, bottomY, { align: 'center' });

  const lineY = bottomY - 8;
  doc
    .moveTo(w / 2 - 100, lineY)
    .lineTo(w / 2 + 100, lineY)
    .lineWidth(0.5)
    .stroke('#cbd5e1');
}
