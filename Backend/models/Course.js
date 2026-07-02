import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'code', 'attachment', 'link'], default: 'link' }
});

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  isPreviewFree: { type: Boolean, default: false },
  order: { type: Number, required: true },
  resources: [resourceSchema],
  externalLinks: [{
    title: { type: String, required: true },
    url: { type: String, required: true }
  }]
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
  reply: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  repliedAt: { type: Date }
});

const courseSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true },
  courseSubtitle: { type: String, default: '' },
  courseDescription: { type: String, required: true },
  coursePrice: { type: Number, required: true },
  isPublished: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], default: 'All Levels' },
  language: { type: String, default: 'English' },
  previewVideo: { type: String, default: '' },
  learningOutcomes: [{ type: String }],
  requirements: [{ type: String }],
  courseContent: [chapterSchema],
  educator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  courseRatings: [ratingSchema],
  courseThumbnail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

courseSchema.index({ tags: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ language: 1 });

courseSchema.index({ educator: 1 });
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ category: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
