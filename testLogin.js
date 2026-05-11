const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

mongoose.connect('mongodb://admin:netlabx123@localhost:27017/netlabx?authSource=admin');

const User = require('./models/User');

async function testLogin() {
  try {
    console.log('=== Testing Login Process ===');
    
    // Step 1: Find user
    const user = await User.findOne({ email: 'admin@matlabx.com' });
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User email:', user.email);
    console.log('User role:', user.role);
    
    // Step 2: Test password comparison
    const password = 'MatLabx@2026';
    console.log('Testing password:', password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      
      // Let's create a new hash and test
      const newHash = await bcrypt.hash(password, 12);
      console.log('New hash:', newHash);
      
      const newMatch = await bcrypt.compare(password, newHash);
      console.log('New hash match:', newMatch);
      
      // Update user with new hash
      user.password = newHash;
      await user.save();
      console.log('Updated user password');
      
      // Test again
      const updatedUser = await User.findOne({ email: 'admin@matlabx.com' });
      const finalMatch = await bcrypt.compare(password, updatedUser.password);
      console.log('Final password match:', finalMatch);
      
      if (finalMatch) {
        console.log('✅ Password fixed!');
      }
    } else {
      console.log('✅ Password matches!');
    }
    
    // Step 3: Test JWT token generation
    if (isMatch) {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
        { expiresIn: '7d' }
      );
      console.log('JWT token generated successfully');
      console.log('Token preview:', token.substring(0, 50) + '...');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
