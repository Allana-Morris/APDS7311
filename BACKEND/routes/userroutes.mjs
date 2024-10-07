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


router.get("/", async(req, res)=>{
  res.status(200).send("Peanits");
  });

// User registration route
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, accountNumber, idNumber } = req.body;
    console.log("Your Mom")
    console.log({firstName, lastName, email, password, confirmPassword, accountNumber, idNumber})
    // Input validation
    const namePattern = /^[a-zA-Z\s]+$/; // Allows only letters and spaces
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/ // Valid email format
    const accountNumberPattern = /^\d{6,11}$/; //South African bank account number validation (6 to 11 digits)
    const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)(\d)$/; // SA ID validation

    if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
        return res.status(400).json({ message: 'Invalid name.' });
    }
    
    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: 'Invalid email.' });
    }

    if (!accountNumberPattern.test(accountNumber)) {
        return res.status(400).json({ message: 'Invalid bank account number.' });
    }

    if (!southAfricanIDPattern.test(idNumber)) {
       // console.log({idNumber})
        return res.status(400).json({ message: 'Invalid South African ID number.'});
        // return res.status(400).json({ message: 'Invalid South African ID.' });
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
            idNumber,
        };

        await db.collection('Users').insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


  
  router.post("/login", bruteforce.prevent, async (req, res) =>
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

    router.get("/dash", checkAuth, async (req, res) => {
      try {
        console.log(req.user)
          
        const accountNumber = req.user.accountNumber; // Get account number from the verified token
        console.log("Account Number:", accountNumber);
  
          // Fetch user-specific data from the database
          const user = await db.collection('Users').findOne({ accountNumber: accountNumber });
  
          if (!user) {
              return res.status(404).json({ message: "User not found" });
          }
  
          // Send user data as response
          res.status(200).json({
              message: "Welcome to your dashboard!",
              user: {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  accountNumber: user.accountNumber
              }
          });
      } catch (error) {
          console.error("Error fetching dashboard data:", error);
          res.status(500).json({ message: "Internal server error" });
      }
  });

export default router;

// Login route
/*router.post("/login", bruteforce.prevent, async (req, res) => {
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
  */