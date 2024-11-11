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


// User registration route
const validateAccountNumber = (accountNumber) => /^\d{6,11}$/.test(accountNumber);
const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(password);
const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/.test(email);
const validateName = (name) => /^[a-zA-Z\s-]+$/.test(name);

// Centralize validation messages
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
    branchCodeError: 'Branch code must be 3 to 5 alphanumeric characters.'
};

const validateUserRegistration = ({ firstName, lastName, userName, email, accountNumber, idNumber, password, confirmPassword }) => {
    if (![firstName, lastName, userName].every(validateName)) return { valid: false, message: messages.invalidName };
    if (!validateEmail(email)) return { valid: false, message: messages.invalidEmail };
    if (!validateAccountNumber(accountNumber)) return { valid: false, message: messages.invalidAccountNumber };
    if (!southAfricanIDPattern.test(idNumber)) return { valid: false, message: messages.invalidID };
    if (!validatePassword(password)) return { valid: false, message: messages.passwordRequirements };
    if (password !== confirmPassword) return { valid: false, message: messages.passwordMismatch };
    return { valid: true };
};

router.post('/', async (req, res) => {
    const { firstName, lastName, userName, email, password, confirmPassword, accountNumber, idNumber } = req.body;
    const validationResult = validateUserRegistration({ firstName, lastName, userName, email, accountNumber, idNumber, password, confirmPassword });
    if (!validationResult.valid) return res.status(400).json({ message: validationResult.message });

    try {
        const existingAccountNumber = await db.collection('Users').findOne({ accountNumber: parseInt(accountNumber, 10) });
        if (existingAccountNumber) return res.status(400).json({ message: messages.userExists });

        const existingUsername = await db.collection('Users').findOne({ userName });
        if (existingUsername) return res.status(400).json({ message: messages.usernameExists });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('Users').insertOne({
            firstName, lastName, userName, email,
            password: hashedPassword, accountNumber: parseInt(accountNumber, 10),
            idNumber, balance: 10000
        });

        res.status(201).json({ message: messages.registrationSuccess });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "An error occurred during registration." });
    }
});

router.post("/Login", bruteforce.prevent, async (req, res) => {
    const { username, accountNumber, password } = req.body;

    try {
        const user = await db.collection("Users").findOne({ $or: [{ accountNumber }, { userName: username }] });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: messages.loginError });
        }

        const token = jwt.sign({ accountNumber: user.accountNumber }, jwtSecret, { expiresIn: "1h" });
        res.status(200).json({ message: "Successful login", token, name: user.firstName });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});

router.post("/payment", checkAuth, async (req, res) => {
    const { type, recBank, recAccNo, amount, swift, branch, currency, recName } = req.body;
    const senderAccountNumber = req.user.accountNumber;
    const transferAmount = parseFloat(amount);

    if (!type || !recBank || !recAccNo || isNaN(transferAmount) || transferAmount <= 0 || !validateName(recName) || !validateAccountNumber(recAccNo)) {
        return res.status(400).json({ message: "Invalid payment details." });
    }

    try {
        const sender = await db.collection('Users').findOne({ accountNumber: senderAccountNumber });
        if (!sender || sender.balance < transferAmount) return res.status(400).json({ message: messages.insufficientFunds });

        const recipient = await db.collection('Users').findOne({ accountNumber: recAccNo });
        const transaction = {
            transactionId: `txn_${Date.now()}`, type, sender: senderAccountNumber,
            recipient: { name: recName, bank: recBank, accountNumber: recAccNo },
            amount: transferAmount, swift, branch, currency, approved: type === "local", date: new Date()
        };

        if (type === "local") {
            await db.collection('Users').updateOne({ accountNumber: senderAccountNumber }, { $inc: { balance: -transferAmount } });
            if (recipient) await db.collection('Users').updateOne({ accountNumber: recAccNo }, { $inc: { balance: transferAmount } });
        }

        await db.collection('Transactions').insertOne(transaction);
        res.status(201).json({ message: "Payment processed.", transaction });

    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ message: "An error occurred while processing payment." });
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

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        const sanitizedUsername = sanitizeInput(username);
        const employee = await db.collection("Employees").findOne({ username: sanitizedUsername });

        if (!employee) {
            return res.status(401).json({ message: "Employee not found" });
        }

        const passwordMatch = await bcrypt.compare(password, employee.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = jwt.sign(
            { username: employee.username },
            jwtSecret,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            employee: { username: employee.username }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed." });
    }
});

// Employee Dashboard Route
router.get("/employeeHome", checkAuth, async (req, res) => {
    try {
        const sanitizedUsername = sanitizeInput(req.user.username);
        const employee = await db.collection("Employees").findOne({ username: sanitizedUsername });

        if (!employee) {
            return res.status(404).json({ message: `Employee not found for ${sanitizedUsername}` });
        }

        const transactions = await db.collection("Transactions").find({ approved: false }).toArray();

        res.status(200).json({
            message: "Welcome to your dashboard!",
            transactions
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Verification Route
router.get("/verify", checkAuth, async (req, res) => {
    try {
        const sanitizedQuery = {
            recipientName: sanitizeInput(req.query.recipientName),
            recipientBank: sanitizeInput(req.query.recipientBank),
            accountNumber: (req.query.accountNumber || '').replace(/\D/g, ''),
            swiftCode: sanitizeInput(req.query.swiftCode),
            field: sanitizeInput(req.query.field),
            amount: parseFloat(req.query.transactionAmount || '0'),
            sender: sanitizeInput(req.query.sender)
        };

        if (!sanitizedQuery.field) {
            return res.status(400).json({ message: "Field to verify is required." });
        }

        const user = await db.collection("internationalUsers").findOne({ accountNumber: sanitizedQuery.accountNumber });

        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const sender = await db.collection("Users").findOne({ accountNumber: sanitizedQuery.sender });
        if (!sender || (sender.balance < sanitizedQuery.amount && sanitizedQuery.field === "transactionAmount")) {
            return res.status(400).json({ message: "Insufficient funds or sender not found." });
        }

        const verificationMessages = {
            recipientName: "Recipient name does not match.",
            recipientBank: "Recipient bank does not match.",
            accountNumber: "Account number does not match.",
            swiftCode: "Swift code does not match."
        };

        if (user[sanitizedQuery.field] !== sanitizedQuery[sanitizedQuery.field]) {
            return res.status(400).json({ message: verificationMessages[sanitizedQuery.field] });
        }

        res.status(200).json({ message: `${sanitizedQuery.field} verification successful.` });

    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ message: "An error occurred during verification" });
    }
});

// Payment Processing Route
router.post("/ProcessPay", checkAuth, async (req, res) => {
    try {
        const sanitizedBody = {
            recipientName: sanitizeInput(req.body.recipientName),
            recipientBank: sanitizeInput(req.body.recipientBank),
            accountNumber: sanitizeInput(req.body.accountNumber),
            swiftCode: sanitizeInput(req.body.swiftCode),
            transactionId: sanitizeInput(req.body.transactionId)
        };

        const transaction = await db.collection("Transactions").findOne({ transactionId: sanitizedBody.transactionId });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const user = await db.collection("Users").findOne({ accountNumber: transaction.sender });
        if (!user) {
            return res.status(404).json({ message: "Sender user not found" });
        }

        const newSenderBalance = user.balance - transaction.amount;
        await db.collection("Users").updateOne({ accountNumber: user.accountNumber }, { $set: { balance: newSenderBalance } });
        await db.collection("Transactions").updateOne({ transactionId: sanitizedBody.transactionId }, { $set: { approved: true } });

        res.status(200).json({ message: "Transaction approved and user updated successfully!" });

    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "An error occurred while processing the payment." });
    }
});

// Transaction Rejection Route
router.post("/rejectPay", checkAuth, async (req, res) => {
    const sanitizedTransactionId = sanitizeInput(req.body.transactionId);

    try {
        const result = await db.collection("Transactions").deleteOne({ transactionId: sanitizedTransactionId });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: "Transaction successfully removed." });
        } else {
            res.status(404).json({ message: "Transaction not found." });
        }
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ message: "Failed to delete transaction." });
    }
});

export default router;
