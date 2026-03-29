import axios from 'axios';

async function test() {
  try {
    // We need a super admin token. admin@cafeqr.com / 123456
    const authRes = await axios.post('http://localhost:9002/api/auth/login', {
      email: 'admin@cafeqr.com',
      password: '123456'
    });
    
    const token = authRes.data.data.token;
    
    const cafeRes = await axios.post('http://localhost:9002/api/cafes', {
      name: "Test Cafe",
      slug: "test-cafe-slug-123",
      email: "test@cafe.com",
      city: "Dubai",
      status: "active"
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Success:', cafeRes.data);
  } catch (err) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
  }
}

test();
