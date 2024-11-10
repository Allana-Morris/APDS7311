import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import expressBrute from 'express-brute';
import checkAuth from '../checkAuth.js';

const router = express.Router();
const store = new expressBrute.MemoryStore();
const bruteforce = new expressBrute(store);

// Getting out the secret
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key'; // fallback if no secret exists

// User registration route
router.post('/', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, accountNumber, idNumber } = req.body;
    const existingUser = await db.collection('Users').findOne({ accountNumber });

    // Regular Expressions for Validation
    const namePattern = /^[a-zA-Z\s-]+$/; // Allows letters, spaces, and hyphens
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/; // Valid email format
    const accountNumberPattern = /^\d{6,11}$/; // South African bank account number validation (6 to 11 digits)
    const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)(\d)$/; // SA ID validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/; // Password validation

    // Input validation function
    const validateInput = (firstName, lastName, email, accountNumber, idNumber, password, confirmPassword) => {
        if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
            return { valid: false, message: 'Invalid name. Only letters, spaces, and hyphens are allowed.' };
        }

        if (!emailPattern.test(email)) {
            return { valid: false, message: 'Invalid email format. Please use a valid email.' };
        }

        if (!accountNumberPattern.test(accountNumber)) {
            return { valid: false, message: 'Invalid bank account number. It should be between 6 and 11 digits.' };
        }

        if (!southAfricanIDPattern.test(idNumber)) {
            return { valid: false, message: 'Invalid South African ID number.' };
        }

        if (!passwordPattern.test(password)) {
            return { valid: false, message: 'Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.' };
        }

        if (password !== confirmPassword) {
            return { valid: false, message: 'Passwords do not match.' };
        }

        return { valid: true }; // All validations passed
    };

    try {
        // Validate the user input
        const validationResult = validateInput(firstName, lastName, email, accountNumber, idNumber, password, confirmPassword);
        if (!validationResult.valid) {
            return res.status(400).json({ message: validationResult.message });
        }

        // Check if user already exists
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Salt and hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountNumber,
            idNumber,
            balance: 10000
        };

        // Insert the new user into the database
        await db.collection('Users').insertOne(newUser);
        console.log(newUser);
        console.log(res.status);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Login route
router.post("/Login", bruteforce.prevent, async (req, res) => {
    const { accountNumber, password } = req.body;

    try {
        // Getting user from database using the credentials
        const collection = await db.collection("Users");
        const user = await collection.findOne({ accountNumber });
        console.log('cannot');
        // User isn't real
        if (!user) {
            console.log('can not');
            return res.status(401).json({ message: "User with account number not found" });
        }

        // Check passwords matching
        const passwordMatch = await bcrypt.compare(password, user.password);

        // They don't match
        if (!passwordMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        // They do match
        else {
            const token = jwt.sign({ accountNumber: accountNumber }, jwtSecret, { expiresIn: "1h" });
            res.status(200).json({ message: "Successful login", token: token, name: req.body.name });
        }
    } catch (error) {
        console.log('uh oh');
        console.error("Login error:", error);
        res.status(500).json({ message: "Login error" });
    }
});

// The home route for the dashboard
router.get("/Home", checkAuth, async (req, res) => {
    try {
        const accountNumber = req.user.accountNumber;
        const user = await db.collection('Users').findOne({ accountNumber: accountNumber });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const transactions = await db.collection('Transactions').find({
            $or: [
                { sender: accountNumber }, // For where user is sender
                { 'recipient.accountNumber': accountNumber } // For where user is recipient
            ]
        }).toArray(); // Put transactions in an array

        res.status(200).json({
            message: "Welcome to your dashboard!",
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                accountNumber: user.accountNumber,
                balance: user.balance
            },
            transactions // Also put in the transactions
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Payment route
router.post("/payment", checkAuth, async (req, res) => {
    try {
        const { type, recBank, recAccNo, amount, swift, branch, currency, recName } = req.body;
        const senderAccountNumber = req.user.accountNumber;
        const transferAmount = parseFloat(amount);

        if (!type || !recBank || !recAccNo || !amount || !recName) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (transferAmount <= 0) {
            return res.status(400).json({ message: "Payment amount must be greater than zero." });
        }

        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(recName)) {
            return res.status(400).json({ message: "Recipient name must contain only letters." });
        }

        const bankNameRegex = /^[A-Za-z\s]+$/;
        if (!bankNameRegex.test(recBank)) {
            return res.status(400).json({ message: "Bank name must contain only letters." });
        }

        const accNoRegex = /^\d{6,11}$/;
        if (!accNoRegex.test(recAccNo)) {
            return res.status(400).json({ message: "Account number must be between 6 and 11 digits." });
        }

        if (type !== "local") {
            const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
            if (!swiftRegex.test(swift)) {
                return res.status(400).json({ message: "Invalid SWIFT code." });
            }

            if (!currency) {
                return res.status(400).json({ message: "Currency is required for international payments." });
            }
        } else {
            if (!branch) {
                return res.status(400).json({ message: "Branch code is required for local payments." });
            }

            const branchRegex = /^[0-9A-Z]{3,5}$/;
            if (!branchRegex.test(branch)) {
                return res.status(400).json({ message: "Branch code must be 3 to 5 alphanumeric characters." });
            }
        }

        const sender = await db.collection('Users').findOne({ accountNumber: senderAccountNumber });

        if (!sender) {
            return res.status(404).json({ message: "Sender not found." });
        }

        const userBalance = sender.balance;
        if (userBalance < transferAmount && type === "local") {
            return res.status(400).json({ message: "Insufficient funds." });
        }

        const recipient = await db.collection('Users').findOne({ accountNumber: recAccNo });

        const transaction = {
            transactionId: `txn_${Date.now()}`,
            type,
            sender: senderAccountNumber,
            recipient: { accountNumber: recAccNo, name: recName },
            amount: transferAmount,
            date: new Date(),
            status: "Pending"
        };

        await db.collection('Transactions').insertOne(transaction);
        res.status(200).json({ message: "Transaction initiated successfully." });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
