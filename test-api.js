const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing backend API...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check:', healthResponse.data);
    
    // Test login endpoint
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@netlabx.com',
      password: 'admin123'
    });
    console.log('Login test:', loginResponse.data);
    
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAPI();
