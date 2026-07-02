import mongoose from 'mongoose';

const educatorSettingsSchema = new mongoose.Schema({
  educator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  defaults: {
    price: { type: Number, default: 0 },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], default: 'All Levels' },
    language: { type: String, default: 'English' },
    category: { type: String, default: 'General' },
  },
  visibility: {
    autoPublish: { type: Boolean, default: false },
    showOnProfile: { type: Boolean, default: true },
  },
  certificate: {
    autoIssue: { type: Boolean, default: true },
    passingScore: { type: Number, default: 80, min: 0, max: 100 },
  },
  enrollment: {
    maxStudents: { type: Number, default: 0 },
    requireApproval: { type: Boolean, default: false },
  },
}, { timestamps: true });

const EducatorSettings = mongoose.model('EducatorSettings', educatorSettingsSchema);
export default EducatorSettings;
