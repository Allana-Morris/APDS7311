const checkAuth = require('../checkAuth'); // Import your checkAuth middleware
const jwt = require('jsonwebtoken');

// Mock jwt.verify explicitly
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

// Mock request, response, and next
const mockRequest = () => {
  const token = jwt.sign({ userId: 1, username: 'testUser' }, 'your_secret_key', { expiresIn: '1h' });

  return {
    headers: {
      authorization: `Bearer ${token}`, // Mock valid token
    },
  };
};

const mockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
};

const next = jest.fn();  // Create a mock function for next()

describe('checkAuth middleware', () => {
  it('should call next if the token is valid', () => {
    // Mock jwt.verify for a valid token
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { userId: 1, username: 'testUser' }); // Simulate valid token
  });

    const req = mockRequest('validToken');
    const res = mockResponse();

    // Call the checkAuth middleware
    checkAuth(req, res, next);

    // Check that next() was called
    expect(next).toHaveBeenCalled();  // Expect next() to be called
  });

  it('should return an error if the token is invalid', () => {
    // Mock jwt.verify for an invalid token
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('jwt malformed'), null); // Simulate invalid token verification
    });

    const req = mockRequest('invalidtoken');
    req.headers.authorization = 'Bearer invalidtoken'; // Modify for invalid token
    const res = mockResponse();

    // Call the checkAuth middleware
    checkAuth(req, res, next);

    // Ensure the response status is 401 and the message is returned
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token invalid: jwt malformed', // Ensure this matches the error returned
    });

    // Ensure next() is not called in the case of an invalid token
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error if no token is provided', () => {
    const req = { headers: {} }; // No authorization header
    const res = mockResponse();

    checkAuth(req, res, next);

    // Ensure the response status is 401 and an error message is returned
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token required', // Error message when token is missing
    });

    // Ensure next() is not called if there's no token
    expect(next).not.toHaveBeenCalled();
  });
});
