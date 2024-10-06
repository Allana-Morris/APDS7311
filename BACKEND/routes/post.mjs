import express from "express";
import db from "../db/conn.mjs"
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

//get all records apparently
router.get("/", async(req, res)=>{
  let collection = await db.collection("posts");
    let results = await collection.find({}).toArray();
    res.send(results).status(200)
//res.status(200).send("No database used here. Just a simple message.");

});

// Login route
router.post("/login", async (req, res) => {
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


