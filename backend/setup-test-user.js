const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function setupTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if test user exists
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (user) {
      console.log('Test user already exists - updating password...');
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      user.password = hashedPassword;
      user.firstName = 'Test';
      user.lastName = 'User';
      user.authProvider = 'local';
      await user.save();
      console.log('Test user password updated!');
    } else {
      console.log('Creating new test user...');
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      user = new User({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        authProvider: 'local',
        displayName: 'Test User'
      });
      await user.save();
      console.log('Test user created!');
    }
    
    console.log('\nTest User Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');
    console.log('\nUser ID:', user._id);
    console.log('Has Payment Method:', user.defaultPaymentMethod ? 'Yes' : 'No');
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupTestUser();

