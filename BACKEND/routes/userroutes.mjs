import express from 'express';
import bcrypt from 'bcrypt';
import db from "../db/conn.mjs";
import jwt from "jsonwebtoken";
import expressBrute from "express-brute"
import checkAuth from '../checkAuth.mjs';

const router = express.Router();
var store = new expressBrute.MemoryStore();
var bruteforce = new expressBrute(store);

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  //const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  const token = jwt.sign(
    { id: user._id, accountNumber: user.accountNumber }, // Include relevant user info in the token
    jwtSecret, // Use the secret from environment or fallback
    { expiresIn: "1h" } // Set expiration
);

  if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
          return res.status(403).json({ message: 'Invalid token.' });
      }

      req.user = user; // Attach user info to request
      next();
  });
};

// User registration route
router.post('/', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, accountNumber, idNumber } = req.body;

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
    // Usage of validateInput
    const validationResult = validateInput(firstName, lastName, email, accountNumber, idNumber, password, confirmPassword);
    if (!validationResult.valid) {
        return res.status(400).json({ message: validationResult.message });
    }

    
        // Check if user already exists
        const existingUser = await db.collection('Users').findOne({ accountNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Salt and hash the password
        const saltRounds = 10; // Number of salt rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const balance = 10000;

        // Create a new user
        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword, // Store hashed password
            accountNumber,
            idNumber,
            balance
        };

        await db.collection('Users').insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


  
  router.post("/Login", bruteforce.prevent, async (req, res) =>
    {
        const {accountNumber, password} = req.body
        console.log(accountNumber + " " + password)

        try 
        {
            const collection = await db.collection("Users")
            const user = await collection.findOne({accountNumber});

            if (!user)
            {
                return res.status(401).json({message: "Auth failed"});
            }

            const passwordMatch = await bcrypt.compare(password, user.password)

            if (!passwordMatch)
            {
                return res.status(401).json({message:"auth failed"})
            }
            else{
                const token = jwt.sign({accountNumber: accountNumber}, jwtSecret, {expiresIn:"1h"})
                res.status(200).json({message: "authentication succ", token: token, name: req.body.name});
                console.log("new token is", token )
            }
        }
        catch (error)
        {
            console.error("Login error:", error)
            res.status(500).json({message: "Login"} )
        }
    });

    router.get("/Home", checkAuth, async (req, res) => {
        try {
          console.log(req.user);
      
          const accountNumber = req.user.accountNumber; // Get account number from the verified token
          console.log("Account Number:", accountNumber);
      
          // Fetch user-specific data from the database
          const user = await db.collection('Users').findOne({ accountNumber: accountNumber });
      
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
      
          // Fetch transactions for the user from the Transactions collection
          const transactions = await db.collection('Transactions').find({
            $or: [
              { sender: accountNumber }, // User as sender
              { 'recipient.accountNumber': accountNumber } // User as recipient
            ]
          }).toArray();
      
          // Send user data and transactions as response
          res.status(200).json({
            message: "Welcome to your dashboard!",
            user: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              accountNumber: user.accountNumber,
              balance: user.balance // Assuming balance is stored in the 'balance' field
            },
            transactions // Add transactions to the response
          });
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      });
      

  router.post("/payment", checkAuth, async (req, res) => {
    try {
        const { type, recBank, recAccNo, amount, swift, branch, currency, recName } = req.body; // Extract payment details from the request body
        const senderAccountNumber = req.user.accountNumber; // Get the logged-in user's account number from the token

        // Convert the amount to a number
        const transferAmount = parseFloat(amount); // Use parseFloat if the amount can be a decimal, or parseInt for integers

        // Validate input
        if (type === "local") {
            if (!type || !recBank || !recAccNo || !amount || !branch || !recName) {
                return res.status(400).json({ message: "All fields are required for local payment." });
            }
        } else {
            if (!type || !recBank || !recAccNo || !amount || !swift || !currency || !recName) {
                return res.status(400).json({ message: "All fields are required for international payment." });
            }
        }

        // Fetch the sender (user) from the database
        const sender = await db.collection('Users').findOne({ accountNumber: senderAccountNumber });

        if (!sender) {
            return res.status(404).json({ message: "Sender not found." });
        }

        // Check if the sender has enough balance
        const userBalance = sender.balance; // Assuming the user's balance is stored in the 'balance' field
        if (userBalance < transferAmount) {
            return res.status(400).json({ message: "Insufficient funds." });
        }

        // Fetch the recipient by account number (if exists)
        const recipient = await db.collection('Users').findOne({ accountNumber: recAccNo });

        // Create a transaction object
        const transaction = {
            transactionId: `txn_${Date.now()}`, // Create a unique transaction ID
            type,
            sender: senderAccountNumber, // Store the sender's account number
            recipient: {
                name: recName,
                bank: recBank,
                accountNumber: recAccNo,
            },
            amount: transferAmount,
            swift,
            branch,
            currency,
            date: new Date(),
        };

        // Deduct the amount from the sender's balance
        const newSenderBalance = userBalance - transferAmount;

        // Update the sender's balance in the database
        await db.collection('Users').updateOne(
            { accountNumber: senderAccountNumber },
            { $set: { balance: newSenderBalance } }
        );

        // If recipient exists, add the amount to their balance
        if (recipient) {
            const newRecipientBalance = recipient.balance + transferAmount;

            // Update the recipient's balance in the database
            await db.collection('Users').updateOne(
                { accountNumber: recAccNo },
                { $set: { balance: newRecipientBalance } }
            );

            res.status(201).json({
                message: "Transaction processed successfully!",
                transaction,
                senderNewBalance: newSenderBalance,
                recipientNewBalance: newRecipientBalance
            });
        } else {
            // If no recipient, just send the response without updating recipient
            res.status(201).json({
                message: "Transaction processed successfully, but no recipient found with the provided account number.",
                transaction,
                senderNewBalance: newSenderBalance
            });
        }

        // Save the transaction in the Transactions collection
        await db.collection('Transactions').insertOne(transaction);
        
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;
