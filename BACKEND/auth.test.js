const { authenticateUser } = require('./authController.js'); // Import the authenticateUser function
const { bcrypt } = require('bcrypt')

// Mock the User model or any database call
jest.mock('./models/User', () => ({
    findOne: jest.fn() // Mock the findOne method of the User model
}));

describe('Authentication Module', () => {
    test('should authenticate valid user credentials', async () => {
        const validCredentials = { username: 'testuser', password: 'securepassword' };

        // Mock the user to return a valid user with a hashed password
        const mockUser = { 
            id: 1, 
            username: 'testuser', 
            password: await bcrypt.hash('securepassword', 10) // Hash the correct password
        };
        require('./models/User').findOne.mockResolvedValue(mockUser); // Mock the database call to return this user

        // Call authenticateUser and check if it returns a token
        const result = await authenticateUser(validCredentials);
        
        expect(result).not.toBe(false); // It should return a token
        expect(result).toMatch(/^\w+\.\w+\.\w+$/); // Ensure the token is in the correct JWT format
    });
      
    test('should fail authentication with invalid password', async () => {
        const invalidCredentials = { username: 'testuser', password: 'wrongpassword' };

        // Mock the user to return a valid user but with the wrong password
        const mockUser = { 
            id: 1, 
            username: 'testuser', 
            password: await bcrypt.hash('securepassword', 10) // Hash the correct password
        };
        require('./models/User').findOne.mockResolvedValue(mockUser); // Mock the database call to return this user

        // Call authenticateUser and check if it returns false
        const result = await authenticateUser(invalidCredentials);
        
        expect(result).toBe(false); // It should return false for invalid password
    });
});
