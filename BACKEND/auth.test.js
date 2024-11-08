// test.js
const { authenticateUser } = require('./checkAuth.js'); // Adjust path as needed

describe('Authentication Module', () => {
  test('should authenticate valid user credentials', async () => {
    const validCredentials = { username: 'testuser', password: 'securepassword' };
    const result = await authenticateUser(validCredentials);
    
    expect(result).toBe(true);
  });

  test('should fail authentication with invalid password', async () => {
    const invalidCredentials = { username: 'testuser', password: 'wrongpassword' };
    const result = await authenticateUser(invalidCredentials);
    
    expect(result).toBe(false);
  });
});
