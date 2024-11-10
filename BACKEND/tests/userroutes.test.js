const request = require('supertest');
const express = require('express');
const userrouter = require('../routes/userroutes'); // Import your Express router here
const app = express();
const db = require('../db/conn'); // Mock the DB connection if needed
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware to handle JSON body parsing
app.use(express.json());
app.use('/api', userrouter);

describe('User Registration and Login Tests', () => {
    describe('POST /api/', () => {
        /* it('should register a new user successfully', async() => {
             const response =  request(app)
                 .post('/api')
                 .send({
                     firstName: 'John',
                     lastName: 'Doe',
                     email: 'johndoe@example.com',
                     password: 'ValidPassword123!',
                     confirmPassword: 'ValidPassword123!',
                     accountNumber: '123456789',
                     idNumber: '8901234567890'
                 });
                 expect(response.status).toBe(201);
                     expect(response.body.message).toBe('User registered successfully!');
         }); */

        it('should return an error when user already exists', async () => {
            db.collection = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue({ accountNumber: '123456789' })
            });
            const response = await request(app)
                .post('/api')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    password: 'ValidPassword123!',
                    confirmPassword: 'ValidPassword123!',
                    accountNumber: '123456789',
                    idNumber: '8501015009083'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('A user with this account number already exists.');
        });

        it('should return an error for invalid input', async () => {
            const response = await request(app)
                .post('/api')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'invalidEmailFormat', // Invalid email format
                    password: 'ValidPassword123!',
                    confirmPassword: 'ValidPassword123!',
                    accountNumber: '987654321', // Unique account number
                    idNumber: '8501015009083'   // Valid South African ID number
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid email format. Please use a valid email.');
        });
    });

    describe('POST /api/Login', () => {
        it('should login successfully with valid credentials', async () => {
            // Mock user retrieval and password comparison
            const mockUser = {
                accountNumber: '123456789',
                password: await bcrypt.hash('ValidPassword123!', 10)
            };

            db.collection = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(mockUser)
            });

            const response = await request(app)
                .post('/api/Login')
                .send({
                    accountNumber: '123456789',
                    password: 'ValidPassword123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Successful login');
            expect(response.body.token).toBeDefined();
        });

        it('should return an error for incorrect password', async () => {
            const mockUser = {
                accountNumber: '123456789',
                password: await bcrypt.hash('ValidPassword123!', 10)
            };

            db.collection = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(mockUser)
            });

            const response = await request(app)
                .post('/api/Login')
                .send({
                    accountNumber: '123456789',
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Incorrect password');
        });

        it('should return an error for non-existent user', async () => {
            db.collection = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(null)
            });

            const response = await request(app)
                .post('/api/Login')
                .send({
                    accountNumber: '123456789',
                    password: 'ValidPassword123!'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('User with account number not found');
        });
    });

    describe('GET /api/Home', () => {
        it('should fetch user dashboard successfully', async () => {
            const mockUser = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                accountNumber: '123456789',
                balance: 5000
            };

            const mockTransactions = [
                { transactionId: 'txn_1', amount: 100, type: 'local' },
                { transactionId: 'txn_2', amount: 200, type: 'local' }
            ];

            db.collection = jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue(mockUser),
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue(mockTransactions)
                })
            });

            // Mock the authentication middleware to simulate successful authentication
            jest.mock('../checkAuth', () => {
                return jest.fn((req, res, next) => {
                    req.user = { accountNumber: '123456789' }; // Mock the user from the token
                    next(); // Proceed with the request
                });
            });

            const token = jwt.sign({ accountNumber: '123456789' }, process.env.JWT_SECRET, { expiresIn: '1h' });

            const response = await request(app)
                .get('/api/Home')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Welcome to your dashboard!');
            expect(response.body.user).toHaveProperty('firstName', 'John');
            expect(response.body.transactions.length).toBe(2);
        });

        it('should return an error for unauthorized access', async () => {
            const response = await request(app).get('/api/Home');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Token invalid: jwt malformed');
        });
    });
});
