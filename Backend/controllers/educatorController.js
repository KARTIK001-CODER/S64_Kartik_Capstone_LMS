import Course from '../models/Course.js';
import User from '../models/User.js';

// Get enrolled students for a course
export const getEnrolledStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        const educatorId = req.user._id;

        // Check if course exists and belongs to the educator
        const course = await Course.findOne({
            _id: courseId,
            educator: educatorId
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        // Get enrolled students with their details
        const enrolledStudents = await User.find({
            _id: { $in: course.enrolledStudents }
        }).select('name email avatar');

        res.status(200).json(enrolledStudents);
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        res.status(500).json({ message: 'Error fetching enrolled students' });
    }
}; 