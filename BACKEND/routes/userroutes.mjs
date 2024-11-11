import express from 'express';
import bcrypt from 'bcrypt';
import db from "../db/conn.mjs";
import jwt from "jsonwebtoken";
import expressBrute from "express-brute"
import checkAuth from '../checkAuth.mjs';
import validator from 'validator';


const router = express.Router();
const store = new expressBrute.MemoryStore();
const bruteforce = new expressBrute(store);

//getting out secret
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key'; //i dont think we actually have a fall back, but idk not my code

// Regular expression for South African ID numbers (use correct pattern if needed)
const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)(\d)$/;

// Validation functions
const validateAccountNumber = (accountNumber) => /^\d{6,11}$/.test(accountNumber);
const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(password);
const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/.test(email);
const validateName = (name) => /^[a-zA-Z\s-]+$/.test(name);
const validateUsername = (username) => /^[a-zA-Z0-9_-]{3,30}$/.test(username);

// Centralized validation messages
const messages = {
    invalidName: 'Only letters, spaces, and hyphens are allowed in names.',
    invalidEmail: 'Please use a valid email format.',
    invalidAccountNumber: 'Account number should be between 6 and 11 digits.',
    invalidID: 'Invalid South African ID number.',
    passwordMismatch: 'Passwords do not match.',
    passwordRequirements: 'Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    userExists: 'A user with this account number already exists.',
    usernameExists: 'A user with this username already exists.',
    registrationSuccess: 'User registered successfully.',
    loginError: 'Incorrect username or password.',
    dashboardError: 'Error fetching dashboard data.',
    insufficientFunds: 'Insufficient funds.',
    invalidRecipientName: 'Recipient name must contain only letters.',
    invalidBankName: 'Bank name must contain only letters.',
    branchCodeError: 'Branch code must be 3 to 5 alphanumeric characters.',
    invalidPaymentDetails: 'Invalid payment details.',
    paymentProcessed: 'Payment processed successfully.',
    serverError: 'An error occurred while processing payment.',
    loginError: 'Incorrect username or password.',
    userNotFound: 'User not found.',
    serverloginError: 'An error occurred during login.'
};

// Validation function for user registration
const validateUserRegistration = ({ firstName, lastName, userName, email, accountNumber, idNumber, password, confirmPassword }) => {
    if (![firstName, lastName, userName].every(validateName)) return { valid: false, message: messages.invalidName };
    if (!validateUsername(userName)) return { valid: false, message: messages.loginError };
    if (!validateEmail(email)) return { valid: false, message: messages.invalidEmail };
    if (!validateAccountNumber(accountNumber)) return { valid: false, message: messages.invalidAccountNumber };
    if (!southAfricanIDPattern.test(idNumber)) return { valid: false, message: messages.invalidID };
    if (!validatePassword(password)) return { valid: false, message: messages.passwordRequirements };
    if (password !== confirmPassword) return { valid: false, message: messages.passwordMismatch };
    return { valid: true };
};

router.post('/', async (req, res) => {
    const { firstName, lastName, userName, email, password, confirmPassword, accountNumber, idNumber } = req.body;

    // Validate user input
    const validationResult = validateUserRegistration({ firstName, lastName, userName, email, accountNumber, idNumber, password, confirmPassword });
    if (!validationResult.valid) return res.status(400).json({ message: validationResult.message });

    try {
        // Check if account number already exists
        const existingAccountNumber = await db.collection('Users').findOne({ accountNumber: parseInt(accountNumber, 10) });
        if (existingAccountNumber) return res.status(400).json({ message: messages.userExists });

        // Check if username already exists
        const existingUsername = await db.collection('Users').findOne({ userName });
        if (existingUsername) return res.status(400).json({ message: messages.usernameExists });

        // Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        await db.collection('Users').insertOne({
            firstName: validator.escape(firstName),   // Escape potential malicious characters
            lastName: validator.escape(lastName),
            userName: validator.escape(userName),
            email: validator.normalizeEmail(email),
            password: hashedPassword,
            accountNumber: parseInt(accountNumber, 10),  // Ensure proper integer conversion
            idNumber: validator.escape(idNumber),  // Escape ID number if necessary
            balance: 10000
        });

        res.status(201).json({ message: messages.registrationSuccess });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "An error occurred during registration." });
    }
});

router.post("/Login", bruteforce.prevent, async (req, res) => {

    const { username, accountNumber, password } = req.body;
    // Input validation
    if (username && !validateUsername(username)) {
        return res.status(400).json({ message: "Invalid username format." });
    }

    if (accountNumber && !validateAccountNumber(accountNumber)) {
        return res.status(400).json({ message: "Invalid account number format." });
    }

    try {
        // Find the user by account number or username
        const user = await db.collection("Users").findOne({
            $or: [{ accountNumber: parseInt(accountNumber, 10) }, { userName: username }]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: messages.loginError });
        }

        // Generate JWT token
        const token = jwt.sign({ accountNumber: user.accountNumber }, jwtSecret, { expiresIn: "1h" });

        // Send response
        res.status(200).json({ message: "Successful login", token, name: user.firstName });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: messages.serverloginError });
    }
});

const validateAmount = (amount) => !isNaN(amount) && parseFloat(amount) > 0;
const validateBankName = (bankName) => /^[a-zA-Z\s]+$/.test(bankName); // Only letters and spaces for bank names

router.post("/payment", checkAuth, async (req, res) => {
    const { type, recBank, recAccNo, amount, swift, branch, currency, recName } = req.body;
    const senderAccountNumber = req.user.accountNumber;
    const transferAmount = parseFloat(amount);

    // Validate the input fields
    if (
        !type ||
        !recBank ||
        !recAccNo ||
        !validateAmount(amount) ||
        !validateName(recName) ||
        !validateAccountNumber(recAccNo) ||
        !validateBankName(recBank)
    ) {
        return res.status(400).json({ message: messages.invalidPaymentDetails });
    }

    try {
        // Fetch sender's data from the database
        const sender = await db.collection('Users').findOne({ accountNumber: senderAccountNumber });
        if (!sender || sender.balance < transferAmount) {
            return res.status(400).json({ message: messages.insufficientFunds });
        }

        // Fetch recipient's data (if necessary)
        const recipient = await db.collection('Users').findOne({ accountNumber: recAccNo });

        // Create the transaction object
        const transaction = {
            transactionId: `txn_${Date.now()}`,
            type,
            sender: senderAccountNumber,
            recipient: { name: recName, bank: recBank, accountNumber: recAccNo },
            amount: transferAmount,
            swift: validator.escape(swift),  // Escape any potentially harmful characters
            branch: validator.escape(branch), // Escape the branch data
            currency: validator.escape(currency), // Escape the currency data
            approved: type === "local", // If it's a local payment, auto-approve
            date: new Date()
        };

        // Handle the transaction based on type (local vs. international)
        if (type === "local") {
            await db.collection('Users').updateOne({ accountNumber: senderAccountNumber }, { $inc: { balance: -transferAmount } });
            if (recipient) {
                await db.collection('Users').updateOne({ accountNumber: recAccNo }, { $inc: { balance: transferAmount } });
            }
        }

        // Insert the transaction record into the database
        await db.collection('Transactions').insertOne(transaction);

        // Respond with a success message and transaction details
        res.status(201).json({ message: messages.paymentProcessed, transaction });

    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ message: messages.serverError });
    }
});



//===================================================================================================================================

const sanitizeInput = (input) => validator.escape(input || '');

const validateField = (fieldName, value, regex, errorMessage) => {
    if (!regex.test(value)) {
        throw new Error(errorMessage || `${fieldName} validation failed.`);
    }
};

// Employee Login Route
router.post("/employeeLogin", bruteforce.prevent, async (req, res) => {
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: messages.missingCredentials });
    }

    // Validate and sanitize username
    const sanitizedUsername = sanitizeInput(username);
    if (!validateUsername(sanitizedUsername)) {
        return res.status(400).json({ message: "Invalid username format." });
    }

    try {
        // Look up the employee by sanitized username
        const employee = await db.collection("Employees").findOne({ username: sanitizedUsername });

        // If employee not found, return an error message
        if (!employee) {
            return res.status(401).json({ message: messages.employeeNotFound });
        }

        // Compare password with stored hash
        const passwordMatch = await bcrypt.compare(password, employee.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: messages.incorrectPassword });
        }

        // Create JWT token for the employee
        const token = jwt.sign(
            { username: employee.username },
            jwtSecret,
            { expiresIn: "1h" }
        );

        // Respond with success and the token
        res.status(200).json({
            message: "Login successful",
            token,
            employee: { username: employee.username }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: messages.loginFailed });
    }
});

// Employee Dashboard Route
router.get("/employeeHome", checkAuth, async (req, res) => {
    try {
        // Sanitize username
        const sanitizedUsername = sanitizeInput(req.user.username);

        // Fetch the employee from the database using sanitized username
        const employee = await db.collection("Employees").findOne({ username: sanitizedUsername });

        // If employee not found, return a 404 response
        if (!employee) {
            return res.status(404).json({ message: messages.employeeNotFound });
        }

        // Fetch unapproved transactions
        const transactions = await db.collection("Transactions").find({ approved: false }).toArray();

        // Return a response with transaction data
        res.status(200).json({
            message: messages.dashboardSuccess,
            transactions
        });
    } catch (error) {
        // Log the error and return a generic error message
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: messages.serverError });
    }
});

// Verification Route
router.get("/verify", checkAuth, async (req, res) => {
    try {
        // Sanitize input fields
        const sanitizedQuery = {
            recipientName: sanitizeInput(req.query.recipientName),
            recipientBank: sanitizeInput(req.query.recipientBank),
            accountNumber: (req.query.accountNumber || '').replace(/\D/g, ''),  // Remove non-digits
            swiftCode: sanitizeInput(req.query.swiftCode),
            field: sanitizeInput(req.query.field),
            amount: parseFloat(req.query.transactionAmount || '0'),
            sender: sanitizeInput(req.query.sender)
        };

        // Validate required field parameter
        if (!sanitizedQuery.field) {
            return res.status(400).json({ message: messages.fieldRequired });
        }

        // Validate account number format
        if (!validateAccountNumber(sanitizedQuery.accountNumber)) {
            return res.status(400).json({ message: "Invalid account number format." });
        }

        // Validate transaction amount
        if (!validateAmount(sanitizedQuery.amount)) {
            return res.status(400).json({ message: "Invalid transaction amount." });
        }

        // Fetch the user with the provided account number
        const user = await db.collection("internationalUsers").findOne({ accountNumber: sanitizedQuery.accountNumber });

        if (!user) {
            return res.status(404).json({ message: messages.userNotFound });
        }

        // Fetch the sender's details and check for sufficient funds
        const sender = await db.collection("Users").findOne({ accountNumber: sanitizedQuery.sender });
        if (!sender || sender.balance < sanitizedQuery.amount) {
            return res.status(400).json({ message: messages.insufficientFunds });
        }

        // Define verification messages for each field
        const verificationMessages = {
            recipientName: "Recipient name does not match.",
            recipientBank: "Recipient bank does not match.",
            accountNumber: "Account number does not match.",
            swiftCode: "Swift code does not match."
        };

        // Perform the field-specific verification
        if (user[sanitizedQuery.field] !== sanitizedQuery[sanitizedQuery.field]) {
            return res.status(400).json({ message: verificationMessages[sanitizedQuery.field] || messages.verificationError });
        }

        // Respond with success message if verification is successful
        res.status(200).json({ message: messages.verificationSuccess(sanitizedQuery.field) });

    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ message: messages.serverError });
    }
});

// Payment Processing Route
router.post("/ProcessPay", checkAuth, async (req, res) => {
    try {
        // Sanitizing input fields from the request body
        const sanitizedBody = {
            recipientName: sanitizeInput(req.body.recipientName),
            recipientBank: sanitizeInput(req.body.recipientBank),
            accountNumber: sanitizeInput(req.body.accountNumber),
            swiftCode: sanitizeInput(req.body.swiftCode),
            transactionId: sanitizeInput(req.body.transactionId)
        };

        // Validate the sanitized input
        if (!validateAccountNumber(sanitizedBody.accountNumber)) {
            return res.status(400).json({ message: "Invalid account number format." });
        }

        // Find the transaction by its ID
        const transaction = await db.collection("Transactions").findOne({ transactionId: sanitizedBody.transactionId });
        if (!transaction) {
            return res.status(404).json({ message: messages.transactionNotFound });
        }

        // Fetch the sender's details and validate sender's existence
        const user = await db.collection("Users").findOne({ accountNumber: transaction.sender });
        if (!user) {
            return res.status(404).json({ message: messages.senderNotFound });
        }

        // Check if the sender has sufficient funds for the transaction
        if (user.balance < transaction.amount) {
            return res.status(400).json({ message: messages.insufficientFunds });
        }

        // Deduct the transaction amount from the sender's balance
        const newSenderBalance = user.balance - transaction.amount;
        await db.collection("Users").updateOne({ accountNumber: user.accountNumber }, { $set: { balance: newSenderBalance } });

        // Update the transaction status to approved
        await db.collection("Transactions").updateOne({ transactionId: sanitizedBody.transactionId }, { $set: { approved: true } });

        // Send success response
        res.status(200).json({ message: messages.transactionApproved });

    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: messages.serverError });
    }
});

// Transaction Rejection Route
router.post("/rejectPay", checkAuth, async (req, res) => {
    const sanitizedTransactionId = sanitizeInput(req.body.transactionId);

    // Validate the transaction ID format
    if (!validateTransactionId(sanitizedTransactionId)) {
        return res.status(400).json({ message: messages.invalidTransactionId });
    }

    try {
        // Attempt to delete the transaction from the database
        const result = await db.collection("Transactions").deleteOne({ transactionId: sanitizedTransactionId });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: messages.transactionDeleted });
        } else {
            res.status(404).json({ message: messages.transactionNotFound });
        }
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ message: messages.serverError });
    }
});

export default router;
