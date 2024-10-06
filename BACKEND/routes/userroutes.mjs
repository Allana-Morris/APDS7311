import express from 'express';
import bcrypt from 'bcrypt';
import validator from 'validator';
import db from "../db/conn.mjs"; // Adjust the path as necessary

const router = express.Router();

// User registration route
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, accountNumber, southAfricanID } = req.body;

    // Input validation
    const namePattern = /^[a-zA-Z\s]+$/; // Allows only letters and spaces
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email format
    const accountNumberPattern = /^[0-9]{6,10}$/; // Adjust based on South African bank account number length (6 to 10 digits)
    const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)$/; // SA ID validation

    if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
        return res.status(400).json({ message: 'Invalid name.'});
    }
    
    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: 'Invalid email.'});
    }

    if (!accountNumberPattern.test(accountNumber)) {
        return res.status(400).json({ message: 'Invalid bank account number.'});
    }

    if (!southAfricanIDPattern.test(southAfricanID)) {
        return res.status(400).json({ message: 'Invalid South African ID.'});
    }

    // Password validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/; // At least 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char

    if (!passwordPattern.test(password)) {
        return res.status(400).json({ message: 'Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
           // return res.status(400).json({ message: 'User already exists.' });
        }

        // Salt and hash the password
        const saltRounds = 10; // Number of salt rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword, // Store hashed password
            accountNumber,
            southAfricanID,
        };

      //  await db.collection('users').insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

export default router;
