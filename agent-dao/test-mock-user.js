// Simple test script to test the mock user service
const { createMockUser } = require('./dist/services/user/userService');

async function testMockUser() {
  try {
    console.log('Testing mock user creation...');
    const user = await createMockUser('test@example.com');
    console.log('Mock user created successfully:');
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error creating mock user:', error);
  }
}

testMockUser(); 