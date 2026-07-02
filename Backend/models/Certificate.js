import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  certificateId: {
    type: String,
    unique: true,
    default: () => crypto.randomUUID()
  },
  studentName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
certificateSchema.index({ studentId: 1, createdAt: -1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
