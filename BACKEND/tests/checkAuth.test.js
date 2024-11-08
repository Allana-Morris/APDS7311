const checkAuth = require('../checkAuth');
const jwt = require('jsonwebtoken');

// Mock jwt.verify explicitly
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn
}));

// Mock request, response, and next
const mockRequest = () => {
  const token = jwt.sign({ accountNumber: '111000' }, 'your_secret_key', { expiresIn: '1h' });
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
  test('should call next() if token is valid', () => {
    // Mocking req, res, next
    const req = {
      headers: {
        authorization: 'Bearer valid_token_here'
      }
    };
    const res = {};
    const next = jest.fn(); // Mock function to track calls to next()

    // Mocking jwt.verify to simulate token verification success
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({
      accountNumber: '012345'
    }));

    // Call the middleware
    checkAuth(req, res, next);

    // Assert that next() was called
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 if token is invalid', () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid_token_here'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    // Mocking jwt.verify to throw an error
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    // Call the middleware
    checkAuth(req, res, next);

    // Assert that status 401 was called and response was sent
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token invalid: jwt malformed'
    });
  });
});
