import express from 'express';
import bcrypt from 'bcrypt';
import db from "../db/conn.mjs";
import User from "../models/User.mjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

router.get("/", async(req, res)=>{
  res.status(200).send("Peanits");
  });

// User registration route
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, accountNumber, southAfricanID } = req.body;

    // Input validation
    const namePattern = /^[a-zA-Z\s]+$/; // Allows only letters and spaces
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/ // Valid email format
    const accountNumberPattern = /^\d{6,11}$/; //South African bank account number validation (6 to 11 digits)
    const southAfricanIDPattern = /^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])\d{4}[01]\d$/; // SA ID validation

    if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
        return res.status(400).json({ message: 'Invalid name.' });
    }
    
    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: 'Invalid email.' });
    }

    if (!accountNumberPattern.test(accountNumber)) {
        return res.status(400).json({ message: 'Invalid bank account number.' });
    }

    if (!southAfricanIDPattern.test(southAfricanID)) {
        return res.status(400).json({ message: 'Invalid South African ID.' });
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
        const existingUser = await db.collection('Users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
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

        await db.collection('Users').insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Login route
router.get("/login", async (req, res) => {
    const { accountNumber, password } = req.body;
  
    try {
      // Find the user by account number
      const user = await User.findOne({ accountNumber });
  
      if (!user) {
        return res.status(400).json("Invalid account number or password");
      }
  
    // Compare the provided password with the stored hashed password using the User model's method
    const isMatch = await user.comparePassword(password);
  
      if (!isMatch) {
        return res.status(400).json("Invalid account number or password");
      }
  
      // Generate a JWT token
      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "1h" });
  
      // Return the JWT token
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json("Server error");
    }
  });


export default router;
