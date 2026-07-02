import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: String },
  endDate: { type: String },
  current: { type: Boolean, default: false },
  description: { type: String }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: { type: String },
  institution: { type: String },
  year: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() {
    return !this.googleId;
  }},
  googleId: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['student', 'educator'], default: 'student' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  experience: [experienceSchema],
  socialLinks: {
    website: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' }
  },
  expertise: [{ type: String }],
  education: educationSchema
}, { timestamps: true });

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;
