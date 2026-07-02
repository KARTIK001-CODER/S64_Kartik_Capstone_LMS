import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './config/mongodb.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Enrollment from './models/Enrollment.js';

const EDUCATORS = [
  { name: 'Sarah Johnson', email: 'sarah@example.com', password: 'password123', role: 'educator' },
  { name: 'Mike Chen', email: 'mike@example.com', password: 'password123', role: 'educator' },
];

const STUDENTS = [
  { name: 'Alex Rivera', email: 'alex@example.com', password: 'password123' },
];

const COURSES = [
  {
    courseTitle: 'JavaScript Mastery: From Zero to Hero',
    courseDescription: '<p>A comprehensive JavaScript course covering everything from variables and data types to async programming, closures, and modern ES6+ features. Build real-world projects and gain the confidence to write production-grade JavaScript.</p><p>This course includes hands-on exercises, quizzes, and a final capstone project.</p>',
    coursePrice: 49.99,
    discount: 20,
    isPublished: true,
    category: 'Programming',
    courseThumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
    chapters: [
      {
        title: 'JavaScript Fundamentals',
        description: 'Core concepts of the language',
        lectures: [
          { title: 'Variables and Data Types', description: 'Understanding let, const, var and data types', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 15, isPreviewFree: true },
          { title: 'Functions and Scope', description: 'Function declarations, expressions, and scoping rules', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 20 },
          { title: 'Objects and Arrays', description: 'Working with collections of data', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 18 },
        ],
      },
      {
        title: 'DOM Manipulation',
        description: 'Interacting with the browser',
        lectures: [
          { title: 'Selecting Elements', description: 'querySelector, getElementById and more', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 12 },
          { title: 'Event Handling', description: 'Click, submit, keyboard events and delegation', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 22 },
        ],
      },
      {
        title: 'Async JavaScript',
        description: 'Promises, async/await, and fetch',
        lectures: [
          { title: 'Callbacks and Promises', description: 'Understanding asynchronous patterns', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 25 },
          { title: 'Async/Await Syntax', description: 'Modern async patterns', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 20 },
          { title: 'Fetching Data from APIs', description: 'Making HTTP requests with fetch', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 18 },
        ],
      },
    ],
  },
  {
    courseTitle: 'React 19: Building Modern Web Applications',
    courseDescription: '<p>Learn React 19 from the ground up. Cover components, hooks, context, routing, state management, and performance optimization. By the end, you\'ll be able to build full-stack React applications with confidence.</p>',
    coursePrice: 69.99,
    discount: 15,
    isPublished: true,
    category: 'Web Development',
    courseThumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    chapters: [
      {
        title: 'React Basics',
        description: 'Getting started with React',
        lectures: [
          { title: 'What is React?', description: 'Understanding the React ecosystem', videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', duration: 10, isPreviewFree: true },
          { title: 'JSX and Components', description: 'Building your first components', videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', duration: 15 },
          { title: 'Props and State', description: 'Managing data in components', videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', duration: 20 },
        ],
      },
      {
        title: 'Hooks Deep Dive',
        description: 'useState, useEffect, useRef, useContext',
        lectures: [
          { title: 'useState and useEffect', description: 'Core hooks for state and side effects', videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', duration: 25 },
          { title: 'Custom Hooks', description: 'Building reusable hook logic', videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', duration: 22 },
          { title: 'useReducer and Context', description: 'Advanced state management', videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', duration: 20 },
        ],
      },
    ],
  },
  {
    courseTitle: 'Node.js & Express: Backend Development',
    courseDescription: '<p>Build production-ready REST APIs with Node.js and Express. Covering routing, middleware, authentication, database integration with MongoDB, error handling, and deployment.</p>',
    coursePrice: 59.99,
    discount: 10,
    isPublished: true,
    category: 'Backend',
    courseThumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400',
    chapters: [
      {
        title: 'Node.js Fundamentals',
        description: 'Core Node.js concepts',
        lectures: [
          { title: 'Node.js Runtime', description: 'Understanding the event loop and modules', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 15, isPreviewFree: true },
          { title: 'File System and Paths', description: 'Working with files and directories', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 12 },
        ],
      },
      {
        title: 'Express Framework',
        description: 'Building web servers with Express',
        lectures: [
          { title: 'Routing and Middleware', description: 'Defining routes and using middleware', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 20 },
          { title: 'Error Handling', description: 'Proper error handling patterns', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 15 },
          { title: 'Authentication with JWT', description: 'Securing APIs with JSON Web Tokens', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 25 },
        ],
      },
      {
        title: 'Database with MongoDB',
        description: 'Mongoose and data modeling',
        lectures: [
          { title: 'Mongoose Schemas', description: 'Defining data models', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 18 },
          { title: 'CRUD Operations', description: 'Create, read, update, delete with MongoDB', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: 22 },
        ],
      },
    ],
  },
  {
    courseTitle: 'Python for Data Science & Machine Learning',
    courseDescription: '<p>Master Python for data analysis, visualization, and machine learning. Covers NumPy, Pandas, Matplotlib, Scikit-learn, and building predictive models with real datasets.</p>',
    coursePrice: 79.99,
    discount: 25,
    isPublished: true,
    category: 'Data Science',
    courseThumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
    chapters: [
      {
        title: 'Python Essentials',
        description: 'Python fundamentals for data science',
        lectures: [
          { title: 'Python Basics Review', description: 'Lists, dicts, comprehensions', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 15, isPreviewFree: true },
          { title: 'NumPy for Numerical Computing', description: 'Arrays, operations, and broadcasting', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 25 },
          { title: 'Pandas for Data Analysis', description: 'DataFrames, filtering, groupby', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 30 },
        ],
      },
      {
        title: 'Data Visualization',
        description: 'Creating compelling charts',
        lectures: [
          { title: 'Matplotlib Basics', description: 'Line plots, bar charts, histograms', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 20 },
          { title: 'Seaborn for Statistical Plots', description: 'Advanced visualizations', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 18 },
        ],
      },
      {
        title: 'Machine Learning',
        description: 'Building predictive models',
        lectures: [
          { title: 'Supervised Learning', description: 'Regression and classification', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 30 },
          { title: 'Model Evaluation', description: 'Cross-validation and metrics', videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0', duration: 20 },
        ],
      },
    ],
  },
  {
    courseTitle: 'UI/UX Design: From Wireframe to Prototype',
    courseDescription: '<p>Learn the complete UI/UX design process: user research, wireframing, visual design, prototyping, and usability testing. Design a real app from scratch using Figma.</p>',
    coursePrice: 44.99,
    discount: 0,
    isPublished: true,
    category: 'Design',
    courseThumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    chapters: [
      {
        title: 'Design Fundamentals',
        description: 'Core principles of good design',
        lectures: [
          { title: 'Color Theory', description: 'Understanding color palettes and accessibility', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: 15, isPreviewFree: true },
          { title: 'Typography', description: 'Font selection and hierarchy', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: 12 },
          { title: 'Layout and Spacing', description: 'Grids, alignment, and white space', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: 18 },
        ],
      },
      {
        title: 'Wireframing',
        description: 'Building the blueprint',
        lectures: [
          { title: 'Low-Fidelity Wireframes', description: 'Sketching ideas quickly', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: 20 },
          { title: 'High-Fidelity Mockups', description: 'Pixel-perfect designs in Figma', videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: 25 },
        ],
      },
    ],
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Don't clear courses/enrollments — allow re-running safely
    // Only delete enrollments for seeded students to avoid duplicates
    const existingCourses = await Course.countDocuments();
    if (existingCourses > 0) {
      console.log(`Found ${existingCourses} existing courses — skipping course creation`);
    }

    // Create educator users
    const createdEducators = [];
    for (const edu of EDUCATORS) {
      const existing = await User.findOne({ email: edu.email });
      if (existing) {
        console.log(`Educator ${edu.email} already exists`);
        createdEducators.push(existing);
      } else {
        const hashedPw = await bcrypt.hash(edu.password, 10);
        const user = await User.create({ ...edu, password: hashedPw });
        createdEducators.push(user);
        console.log(`Created educator: ${edu.email}`);
      }
    }

    // Create student
    const studentData = STUDENTS[0];
    let student = await User.findOne({ email: studentData.email });
    if (!student) {
      const hashedPw = await bcrypt.hash(studentData.password, 10);
      student = await User.create({ ...studentData, password: hashedPw });
      console.log(`Created student: ${studentData.email}`);
    } else {
      console.log(`Student ${studentData.email} already exists`);
    }

    // Create courses (only if none exist)
    let createdCourseIds = [];
    if (existingCourses === 0) {
      for (let i = 0; i < COURSES.length; i++) {
        const c = COURSES[i];
        const educator = createdEducators[i % createdEducators.length];

        const courseContent = c.chapters.map((ch, chIdx) => ({
          title: ch.title,
          description: ch.description,
          order: chIdx + 1,
          lectures: ch.lectures.map((lec, lecIdx) => ({
            title: lec.title,
            description: lec.description,
            videoUrl: lec.videoUrl,
            duration: lec.duration,
            isPreviewFree: lec.isPreviewFree || false,
            order: lecIdx + 1,
          })),
        }));

        const course = await Course.create({
          courseTitle: c.courseTitle,
          courseDescription: c.courseDescription,
          coursePrice: c.coursePrice,
          discount: c.discount,
          isPublished: c.isPublished,
          category: c.category,
          courseThumbnail: c.courseThumbnail,
          courseContent,
          educator: educator._id,
          enrolledStudents: [],
        });

        createdCourseIds.push(course._id);
        console.log(`Created course: "${c.courseTitle}" (${c.category})`);
      }
    } else {
      const courses = await Course.find({}).sort({ createdAt: 1 });
      createdCourseIds = courses.map(c => c._id);
    }

    // Get all courses for enrollment
    const courses = await Course.find({}).sort({ createdAt: 1 });

    // Helper: enroll a student in demo courses with varied progress
    async function enrollStudent(targetStudent) {
      if (courses.length < 4) return null;

      const c1 = courses[0], c3 = courses[2], c4 = courses[3], c5 = courses[4];
      const enrolledIds = [];

      // Helper to avoid duplicate enrollments
      const ensureEnrollment = async (course, data) => {
        const existing = await Enrollment.findOne({ studentId: targetStudent._id, courseId: course._id });
        if (existing) {
          enrolledIds.push(course._id);
          return existing;
        }
        const enrollment = await Enrollment.create({ studentId: targetStudent._id, courseId: course._id, ...data });
        if (!course.enrolledStudents.includes(targetStudent._id)) {
          course.enrolledStudents.push(targetStudent._id);
          await course.save();
        }
        enrolledIds.push(course._id);
        return enrollment;
      };

      const c1Lectures = c1.courseContent.flatMap(ch => ch.lectures);
      await ensureEnrollment(c1, {
        paymentId: 'seed_payment_1', orderId: 'seed_order_1', amount: c1.coursePrice,
        status: 'completed',
        progress: [
          { lectureId: c1Lectures[0]._id, completed: true, completedAt: new Date(Date.now() - 86400000 * 3) },
          { lectureId: c1Lectures[1]._id, completed: true, completedAt: new Date(Date.now() - 86400000 * 2) },
        ],
        lastWatchedLectureId: c1Lectures[1]._id,
        lastWatchedChapterIndex: 0, lastWatchedLectureIndex: 1,
        enrolledAt: new Date(Date.now() - 86400000 * 7),
      });

      await ensureEnrollment(c3, {
        paymentId: 'seed_payment_3', orderId: 'seed_order_3', amount: c3.coursePrice,
        status: 'completed', progress: [],
        enrolledAt: new Date(Date.now() - 86400000 * 2),
      });

      const c4Lectures = c4.courseContent.flatMap(ch => ch.lectures);
      await ensureEnrollment(c4, {
        paymentId: 'seed_payment_4', orderId: 'seed_order_4', amount: c4.coursePrice,
        status: 'completed',
        progress: c4Lectures.map(l => ({ lectureId: l._id, completed: true, completedAt: new Date(Date.now() - 86400000) })),
        courseCompleted: true, courseCompletedAt: new Date(Date.now() - 86400000),
        enrolledAt: new Date(Date.now() - 86400000 * 5),
      });

      const c5Lectures = c5.courseContent.flatMap(ch => ch.lectures);
      await ensureEnrollment(c5, {
        paymentId: 'seed_payment_5', orderId: 'seed_order_5', amount: c5.coursePrice,
        status: 'completed',
        progress: c5Lectures.map(l => ({ lectureId: l._id, completed: true, completedAt: new Date(Date.now() - 86400000) })),
        courseCompleted: true, courseCompletedAt: new Date(Date.now() - 86400000),
        enrolledAt: new Date(Date.now() - 86400000 * 10),
      });

      targetStudent.enrolledCourses = [...new Set([...targetStudent.enrolledCourses.map(String), ...enrolledIds.map(String)])];
      await targetStudent.save();
    }

    // Enroll the seeded student
    await enrollStudent(student);

    // Enroll ALL existing student users
    const allStudents = await User.find({ role: 'student', _id: { $ne: student._id } });
    for (const s of allStudents) {
      await enrollStudent(s);
      console.log(`  → Enrolled ${s.name} (${s.email})`);
    }

    console.log('\n========== SEED COMPLETE ==========');
    console.log('Educators:');
    for (const e of createdEducators) {
      console.log(`  - ${e.name} (${e.email}) / password123`);
    }
    console.log(`\nDemo student: ${student.name} (${student.email}) / password123`);
    const token = student.generateAuthToken();
    console.log(`  JWT: ${token}`);
    console.log(`\nAll existing students have been enrolled in demo courses.`);
    console.log(`Courses: ${courses.length} available`);
    console.log('====================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
