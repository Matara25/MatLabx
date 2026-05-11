const bcrypt = require('bcryptjs');

async function simpleTest() {
  console.log('=== Simple Bcrypt Test ===');
  
  const password = 'MatLabx@2026';
  console.log('Testing password:', password);
  
  // Create hash
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash:', hash);
  
  // Test comparison
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Comparison result:', isMatch);
  
  // Test with different password
  const wrongMatch = await bcrypt.compare('wrongpassword', hash);
  console.log('Wrong password comparison:', wrongMatch);
  
  console.log('=== Test Complete ===');
}

simpleTest().catch(console.error);
