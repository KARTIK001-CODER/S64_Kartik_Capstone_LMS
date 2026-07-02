import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const promoteUser = async () => {
    const email = process.argv[2]; // Get email from command line argument directly

    if (!email) {
        console.log('Please provide an email address.');
        console.log('Usage: node promote_educator.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email '${email}' not found.`);
            console.log('Make sure you have registered on the website first!');
        } else {
            user.role = 'educator';
            await user.save();
            console.log(`✅ Success! User '${user.name}' (${email}) is now an EDUCATOR.`);
            console.log('You can now log in and create courses.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

promoteUser();
