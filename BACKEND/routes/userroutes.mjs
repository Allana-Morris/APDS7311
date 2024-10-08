import express from 'express';
import bcrypt from 'bcrypt';
import db from "../db/conn.mjs";
import jwt from "jsonwebtoken";
import expressBrute from "express-brute"
import checkAuth from '../checkAuth.mjs';

const router = express.Router();
var store = new expressBrute.MemoryStore();
var bruteforce = new expressBrute(store);

//getting out secret
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key'; //i dont think we actually have a fall back, but idk not my code


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


  //Login route
  router.post("/Login", bruteforce.prevent, async (req, res) =>
    {
        //getting the input
        const {accountNumber, password} = req.body

        //try to login
        try 
        {
            //getting user from database using the credentials
            const collection = await db.collection("Users")
            const user = await collection.findOne({accountNumber});

            //user isnt real
            if (!user)
            {
                return res.status(401).json({message: "User with account number not found"});
            }

            //check passwords matching
            const passwordMatch = await bcrypt.compare(password, user.password)

            //they dont match
            if (!passwordMatch)
            {
                return res.status(401).json({message:"Incorrect password"})
            }
            //they do match
            else{
                const token = jwt.sign({accountNumber: accountNumber}, jwtSecret, {expiresIn:"1h"})
                res.status(200).json({message: "Successful login", token: token, name: req.body.name});
            }
        }
        //catch an error 
        catch (error)
        {
            console.error("Login error:", error)
            res.status(500).json({message: "Login"} )
        }
    });

    //the home route for the dash board
    router.get("/Home", checkAuth, async (req, res) => { //run check auth along side it
        try {
      
            //get the account number from the token
          const accountNumber = req.user.accountNumber;
      
          //get user data from the db
          const user = await db.collection('Users').findOne({ accountNumber: accountNumber });
      
          //if user isnt found, this should hopefully never happen unless someone is playing in the database
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
      
          //get all the user transactions
          const transactions = await db.collection('Transactions').find({
            $or: [
              { sender: accountNumber }, //for where user is sender
              { 'recipient.accountNumber': accountNumber } //for where user is recipient
            ]
          }).toArray(); //put transactions in an array
      
          //send user data and transactions as response
          res.status(200).json({
            message: "Welcome to your dashboard!",
            user: {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              accountNumber: user.accountNumber,
              balance: user.balance
            },
            transactions //also put in the transactions
          });
          //error for if all goes wrong
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      });
      
      //payment route
      router.post("/payment", checkAuth, async (req, res) => { //make sure to check auth alng side it
        try {
            //getting payment details from req
            //also getting account number from sender (the logged user)
            const { type, recBank, recAccNo, amount, swift, branch, currency, recName } = req.body; 
            const senderAccountNumber = req.user.accountNumber; 
    
            //convert amount to number specifically a float
            const transferAmount = parseFloat(amount); 
    
            // Validate general input
            if (!type || !recBank || !recAccNo || !amount || !recName) {
                return res.status(400).json({ message: "All fields are required." });
            }
    
            // validate paymnent larger than 0
            if (transferAmount <= 0) {
                return res.status(400).json({ message: "Payment amount must be greater than zero." });
            }
    
            //validate recipient name, only letters allowed
            const nameRegex = /^[A-Za-z\s]+$/;
            if (!nameRegex.test(recName)) {
                return res.status(400).json({ message: "Recipient name must contain only letters." });
            }
    
            //validate bank name, cannot contain numbers
            const bankNameRegex = /^[A-Za-z\s]+$/;
            if (!bankNameRegex.test(recBank)) {
                return res.status(400).json({ message: "Bank name must contain only letters." });
            }
    
            //validate recipient account number, only digits, 6 to 11 characters
            const accNoRegex = /^\d{6,11}$/;
            if (!accNoRegex.test(recAccNo)) {
                return res.status(400).json({ message: "Account number must be between 6 and 11 digits and can only contain numbers." });
            }
    
            //  validate SWIFT code and currency only for non-local payments only
            if (type !== "local") {
                //validate SWIFT code for 8 or 11 characters, first 6 must be letters
                const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/; //example: AAAABBCCDDD or AAAABBCC
                if (!swiftRegex.test(swift)) {
                    return res.status(400).json({ message: "SWIFT code must be 8 or 11 characters long and can only contain letters and numbers." });
                }
    
                // Validate currency
                if (!currency) {
                    return res.status(400).json({ message: "Currency is required for international payments." });
                }
            } else {
                //validate branch code only for local payments
                if (!branch) {
                    return res.status(400).json({ message: "Branch code is required for local payments." });
                }
    
                //validate branch code, made it 3 or 5 letters, caps sensitive
                const branchRegex = /^[0-9A-Z]{3,5}$/; // Example: 123 or ABCD
                if (!branchRegex.test(branch)) {
                    return res.status(400).json({ message: "Branch code must be 3 to 5 alphanumeric characters." });
                }
            }
    
            //fetch the user from the database
            const sender = await db.collection('Users').findOne({ accountNumber: senderAccountNumber });
    
            //validate if the user is real, (they should be)
            if (!sender) {
                return res.status(404).json({ message: "Sender not found." });
            }
    
            //check if the sender has enough balance
            const userBalance = sender.balance;
            if (userBalance < transferAmount) {
                return res.status(400).json({ message: "Insufficient funds." });
            }
    
            //get the recipient by account number
            const recipient = await db.collection('Users').findOne({ accountNumber: recAccNo });
    
            //creating the transaction object
            const transaction = {
                transactionId: `txn_${Date.now()}`, //just an id for genera purpose
                type,
                sender: senderAccountNumber, //the user/senders account number
                recipient: { //the whole recipient object/info
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
    
            //deduct the amount from the sender/user balance
            const newSenderBalance = userBalance - transferAmount;
    
            //update the sender balance
            await db.collection('Users').updateOne(
                { accountNumber: senderAccountNumber },
                { $set: { balance: newSenderBalance } }
            );
    
            //check if the recipient is in the databse, if they are we can add money to them
            if (recipient) {
                //making the new balance
                const newRecipientBalance = recipient.balance + transferAmount;
    
                //update recipient balance
                await db.collection('Users').updateOne(
                    { accountNumber: recAccNo },
                    { $set: { balance: newRecipientBalance } }
                );
    
                //show its success
                res.status(201).json({
                    message: "Transaction processed successfully!",
                    transaction,
                    senderNewBalance: newSenderBalance,
                    recipientNewBalance: newRecipientBalance
                });
            } else {
                // If no recipient then its still all cool, just money leaving the economy
                res.status(201).json({
                    message: "Transaction processed successfully, but no recipient found with the provided account number.",
                    transaction,
                    senderNewBalance: newSenderBalance
                });
            }
    
            //store the transaction in the database
            await db.collection('Transactions').insertOne(transaction);
            
        } catch (error) {
            //general error for if all goes wrong
            console.error("Error processing payment:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

export default router;
