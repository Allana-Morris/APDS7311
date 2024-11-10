const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/conn.js');
const jwt = require('jsonwebtoken');
const expressBrute = require('express-brute');
const checkAuth = require('../checkAuth.js');
const validator = require('validator');


const router = express.Router();
var store = new expressBrute.MemoryStore();
var bruteforce = new expressBrute(store);

//getting out secret
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key'; //i dont think we actually have a fall back, but idk not my code


// User registration route
router.post('/', async (req, res) => {
    const { firstName, lastName, userName, email, password, confirmPassword, accountNumber, idNumber } = req.body;

    // Regular Expressions for Validation
    const namePattern = /^[a-zA-Z\s-]+$/; // Allows letters, spaces, and hyphens
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/; // Valid email format
    const accountNumberPattern = /^\d{6,11}$/; // South African bank account number validation (6 to 11 digits)
    const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)(\d)$/; // SA ID validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/; // Password validation

    // Input validation function
    const validateInput = (firstName, lastName, userName, email, accountNumber, idNumber, password, confirmPassword) => {
        if (!namePattern.test(firstName) || !namePattern.test(lastName) || !namePattern.test(userName)) {
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

        return { valid: true };


    };

    try {
        // Usage of validateInput
        const validationResult = validateInput(firstName, lastName, userName, email, accountNumber, idNumber, password, confirmPassword);
        if (!validationResult.valid) {
            return res.status(400).json({ message: validationResult.message });
        }


        // Check if user already exists
        // Check if the account number already exists
        const existingAccountNumber = await db.collection('Users').findOne({ accountNumber });
        if (existingAccountNumber) {
            return res.status(400).json({ message: 'A user with this account number already exists.' });
        }

        // Check if the username already exists
        const existingUsername = await db.collection('Users').findOne({ userName });
        if (existingUsername) {
            return res.status(400).json({ message: 'A user with this username already existss.' + userName });
        }

        // Proceed with registration if both checks pass


        // Salt and hash the password
        const saltRounds = 10; // Number of salt rounds
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const balance = 10000;

        // Create a new user
        const newUser = {
            firstName,
            lastName,
            userName,
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
router.post("/Login", bruteforce.prevent, async (req, res) => {
    //getting the input
    const { username, accountNumber, password } = req.body

    //try to login
    try {
        //getting user = require( database using the credentials
        const collection = await db.collection("Users")
        const user = await collection.findOne({
            $or: [
                { accountNumber: accountNumber },
            ]
        });

        //user isnt real
        if (!user) {
            return res.status(401).json({ message: "User with account number not found" });
        }

        if (user.userName != username) {
            return res.status(401).json({ message: "Incorrect username" });


        }



        //check passwords matching
        const passwordMatch = await bcrypt.compare(password, user.password)

        //they dont match
        if (!passwordMatch) {
            return res.status(401).json({ message: "Incorrect password" })
        }
        //they do match
        else {
            const token = jwt.sign({ accountNumber: user.accountNumber }, jwtSecret, { expiresIn: "1h" })
            res.status(200).json({ message: "Successful login", token: token, name: req.body.name });
        }
    }
    //catch an error 
    catch (error) {
        console.error("Login error:", error)
        res.status(500).json({ message: "Login" })
    }
});

//the home route for the dash board
router.get("/Home", checkAuth, async (req, res) => { //run check auth along side it
    try {

        //get the account number = require( the token
        const accountNumber = req.user.accountNumber;

        //get user data = require( the db
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
router.post("/payment", checkAuth, async (req, res) => { // Ensure authentication is checked
    try {
        // Getting payment details = require( req
        const { type, recBank, recAccNo, amount, swift, branch, currency, recName } = req.body;
        const senderAccountNumber = req.user.accountNumber;

        // Convert amount to number (float)
        const transferAmount = parseFloat(amount);

        // Validate general input
        if (!type || !recBank || !recAccNo || !amount || !recName) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Validate payment larger than 0
        if (transferAmount <= 0) {
            return res.status(400).json({ message: "Payment amount must be greater than zero." });
        }

        // Validate recipient name (only letters allowed)
        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(recName)) {
            return res.status(400).json({ message: "Recipient name must contain only letters." });
        }

        // Validate bank name (cannot contain numbers)
        const bankNameRegex = /^[A-Za-z\s]+$/;
        if (!bankNameRegex.test(recBank)) {
            return res.status(400).json({ message: "Bank name must contain only letters." });
        }

        // Validate recipient account number (only digits, 6 to 11 characters)
        const accNoRegex = /^\d{6,11}$/;
        if (!accNoRegex.test(recAccNo)) {
            return res.status(400).json({ message: "Account number must be between 6 and 11 digits and can only contain numbers." });
        }

        // Validate SWIFT code and currency for non-local payments
        if (type !== "local") {
            const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/; // Example: AAAABBCCDDD or AAAABBCC
            if (!swiftRegex.test(swift)) {
                return res.status(400).json({ message: "SWIFT code must be 8 or 11 characters long and can only contain letters and numbers." });
            }

            // Validate currency for international payments
            if (!currency) {
                return res.status(400).json({ message: "Currency is required for international payments." });
            }
        } else {
            // Validate branch code for local payments
            if (!branch) {
                return res.status(400).json({ message: "Branch code is required for local payments." });
            }

            // Validate branch code (3 or 5 alphanumeric characters)
            const branchRegex = /^[0-9A-Z]{3,5}$/; // Example: 123 or ABCD
            if (!branchRegex.test(branch)) {
                return res.status(400).json({ message: "Branch code must be 3 to 5 alphanumeric characters." });
            }
        }

        // Fetch the sender (logged in user) = require( the database
        const sender = await db.collection('Users').findOne({ accountNumber: senderAccountNumber });

        // Validate if the sender exists
        if (!sender) {
            return res.status(404).json({ message: "Sender not found." });
        }

        // Check if the sender has enough balance for the transaction
        const userBalance = sender.balance;
        if (userBalance < transferAmount && type === "local") { // Do not check balance for international payments
            return res.status(400).json({ message: "Insufficient funds." });
        }

        // Get the recipient by account number
        const recipient = await db.collection('Users').findOne({ accountNumber: recAccNo });

        // Create the transaction object
        const transaction = {
            transactionId: `txn_${Date.now()}`, // Generate a unique ID for the transaction
            type,
            sender: senderAccountNumber, // Sender's account number
            recipient: { // Recipient details
                name: recName,
                bank: recBank,
                accountNumber: recAccNo,
            },
            amount: transferAmount,
            swift,
            branch,
            currency,
            approved: type === "local", // Local payments are approved immediately, international payments are not
            date: new Date(),
        };

        // Deduct the amount = require( the sender’s balance if it is a local payment
        if (type === "local") {
            const newSenderBalance = userBalance - transferAmount;

            // Update sender's balance
            await db.collection('Users').updateOne(
                { accountNumber: senderAccountNumber },
                { $set: { balance: newSenderBalance } }
            );

            // Update recipient balance if recipient exists
            if (recipient) {
                const newRecipientBalance = recipient.balance + transferAmount;
                await db.collection('Users').updateOne(
                    { accountNumber: recAccNo },
                    { $set: { balance: newRecipientBalance } }
                );

                res.status(201).json({
                    message: "Transaction processed successfully!",
                    transaction,
                    senderNewBalance: newSenderBalance,
                    recipientNewBalance: newRecipientBalance,
                });
            } else {
                res.status(201).json({
                    message: "Transaction processed successfully, but no recipient found with the provided account number.",
                    transaction,
                    senderNewBalance: newSenderBalance,
                });
            }
        } else {
            // For international payments, do not deduct the sender's balance
            if (recipient) {
                res.status(201).json({
                    message: "Transaction processed successfully!",
                    transaction,
                    senderBalance: userBalance, // Sender's balance stays the same
                });
            } else {
                res.status(201).json({
                    message: "Transaction processed successfully!",
                    transaction,
                    senderBalance: userBalance, // Sender's balance stays the same
                });
            }
        }

        // Store the transaction in the database
        await db.collection('Transactions').insertOne(transaction);

    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});


//===================================================================================================================================

router.post("/employeeLogin", bruteforce.prevent, async (req, res) => {
    const { username, password } = req.body;


    // Input validation
    if (!username || !password) {
        v
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        // Sanitize inputs
        const sanitizedUsername = validator.escape(username);

        // Look up employee by username in the Employees collection
        const collection = await db.collection("Employees");
        const employee = await collection.findOne({ username: sanitizedUsername });

        // Employee not found
        if (!employee) {
            return res.status(401).json({ message: "Employee not found" });
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, employee.password);
        if (!passwordMatch) {
            //const saltRounds = 10; // Number of salt rounds
            //const hashedPassword = await bcrypt.hash(password, saltRounds);
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Generate JWT with employee username
        const token = jwt.sign(
            { username: employee.username }, // Using username only as payload
            jwtSecret,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            employee: {
                username: employee.username
            }
        });
    } catch (error) {
        console.error("Login errorr:", error)
        res.status(500).json({ message: "Login" })
    }
});

router.get("/employeeHome", checkAuth, async (req, res) => { //make sure to check auth along side it
    try {
        // Sanitize token payload
        const username = validator.escape(req.user.username);

        //get user data = require( the db
        const employee = await db.collection('Employees').findOne({ username: username });

        //if user isnt found, this should hopefully never happen unless someone is playing in the database
        if (!employee) {
            return res.status(404).json({ message: "employee not found" + username });
        }

        //get all the user transactions
        const transactions = await db.collection('Transactions').find({
            $or: [
                { approved: false }, //for where unapproved
            ]
        }).toArray(); //put transactions in an array

        //send user data and transactions as response
        res.status(200).json({
            message: "Welcome to your dashboard!",
            transactions //also put in the transactions
        });
        //error for if all goes wrong
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Internal server error" });
    }

});

router.get("/verify", checkAuth, async (req, res) => {
    try {
        //Sanitize database query
        const sanitizedQuery = {
            recipientName: validator.escape(req.query.recipientName || ''),
            recipientBank: validator.escape(req.query.recipientBank || ''),
            accountNumber: req.query.accountNumber.replace(/\D/g, ''),  // Remove all non-digit characters
            swiftCode: validator.escape(req.query.swiftCode || ''),
            field: validator.escape(req.query.field || ''),
            amount: validator.escape(req.query.transactionAmount || ''),
            sender: validator.escape(req.query.sender || '')

        };


        // Check for missing fields and respond with an error if any are missing
        if (!sanitizedQuery.field) {
            return res.status(400).json({ message: "Field to verify is required." });
        }

        // Query the internationalUsers collection to find the user with the given account number
        const user = await db.collection("internationalUsers").findOne({ accountNumber: sanitizedQuery.accountNumber });

        // If the user does not exist, return an error message
        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        // Perform the field verification based on the received field
        switch (sanitizedQuery.field) {
            case "recipientName":
                if (user.name !== sanitizedQuery.recipientName) {
                    return res.status(400).json({ message: "Recipient name does not match." });
                }
                break;

            case "recipientBank":
                if (user.bank !== sanitizedQuery.recipientBank) {
                    return res.status(400).json({ message: "Recipient bank does not match." });
                }
                break;

            case "accountNumber":
                if (user.accountNumber !== sanitizedQuery.accountNumber) {
                    return res.status(400).json({ message: "Account number does not match." });
                }
                break;

            case "swiftCode":
                if (user.swiftCode !== sanitizedQuery.swiftCode) {
                    return res.status(400).json({ message: "Swift code does not match." });
                }
                break;

            case "transactionAmount":
                const sender = db.collection("Users").findOne({ accountNumber: sanitizedQuery.sender })
                if ((sender.balance - sanitizedQuery.amount) < 0) {
                    return res.status(400).json({ message: "Insufficient funds = require( sender" });
                }
                break;

            default:
                return res.status(400).json({ message: "Invalid field to verify." });
        }

        // Return a successful response after verification
        res.status(200).json({ message: `${sanitizedQuery.field} verification successful.` });

    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ message: "An error occurred during verification" });
    }
});

router.post("/ProcessPay", checkAuth, async (req, res) => {
    try {
        // Destructure transactionId = require( the request body
        //Sanitize database query
        const sanitizedBody = {
            recipientName: validator.escape(req.body.recipientName || ''),
            recipientBank: validator.escape(req.body.recipientBank || ''),
            accountNumber: validator.escape(req.body.accountNumber || ''),
            swiftCode: validator.escape(req.body.swiftCode || ''),
            transactionId: validator.escape(req.body.transactionId || '')
        };
        // Step 1: Fetch the transaction document using transactionId
        const transaction = await db.collection("Transactions").findOne({ transactionId: sanitizedBody.transactionId });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Step 2: Update the user where transaction sender field matches user's accountNumber field
        const user = await db.collection("Users").findOne({ accountNumber: transaction.sender });
        if (!user) {
            return res.status(404).json({ message: "Sender user not found" });
        }

        // Example of updating user if necessary
        // user.someField = "new value"; // Modify any necessary fields on the user document
        const newSenderBalance = user.balance - transaction.amount;

        // Update sender's balance
        await db.collection('Users').updateOne(
            { accountNumber: user.accountNumber },
            { $set: { balance: newSenderBalance } }
        );

        // Step 3: Set the transaction's approved field to true
        transaction.approved = true;
        await db.collection('Transactions').updateOne(
            { transactionId: sanitizedBody.transactionId },
            { $set: { approved: true } }
        );

        res.status(200).json({ message: "Transaction approved and user updated successfully!" });

    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "An error occurred while processing the payment." });
    }
});

router.post("/rejectPay", checkAuth, async (req, res) => {
    const sanitizedTransactionId = validator.escape(req.body.transactionId || '');

    try {
        const result = await db.collection('Transactions').deleteOne({ transactionId: sanitizedTransactionId });

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


module.exports = router;
