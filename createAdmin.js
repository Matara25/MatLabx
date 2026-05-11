const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://admin:netlabx123@localhost:27017/netlabx?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function createAdmin() {
  try {
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('MatLabx@2026', 10);
    
    console.log('Creating admin user with hashed password...');
    
    const admin = new User({
      username: 'admin',
      email: 'admin@matlabx.com',
      password: hashedPassword,
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        institution: 'NetLabX',
        experienceLevel: 'advanced'
      },
      stats: {
        labsCompleted: 0,
        totalLabTime: 0,
        averageScore: 0,
        skills: []
      },
      isVerified: true,
      hasCompletedOnboarding: true,
      verificationToken: null,
      verificationTokenExpires: null,
      skills: [],
      goals: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@matlabx.com');
    console.log('Password: MatLabx@2026');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
