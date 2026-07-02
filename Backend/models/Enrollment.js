import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
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
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  progress: [{
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  }],
  lastWatchedLectureId: {
    type: mongoose.Schema.Types.ObjectId
  },
  lastWatchedChapterIndex: {
    type: Number
  },
  lastWatchedLectureIndex: {
    type: Number
  },
  courseCompleted: {
    type: Boolean,
    default: false
  },
  courseCompletedAt: {
    type: Date
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
});

enrollmentSchema.index({ studentId: 1, courseId: 1 });
enrollmentSchema.index({ status: 1, enrolledAt: -1 });
enrollmentSchema.index({ courseId: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
