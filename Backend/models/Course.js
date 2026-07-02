import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true }, // in seconds
  isPreviewFree: { type: Boolean, default: false },
  order: { type: Number, required: true }
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  lectures: [lectureSchema],
  order: { type: Number, required: true }
});

const ratingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: String,
  createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true },
  courseDescription: { type: String, required: true },
  coursePrice: { type: Number, required: true },
  isPublished: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  courseContent: [chapterSchema],
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  courseRatings: [ratingSchema],
  courseThumbnail: { type: String, required: true },
  category: { type: String, default: 'General' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

courseSchema.index({ educator: 1 });
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ category: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
