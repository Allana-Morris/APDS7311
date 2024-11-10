import express from "express";
import https from "https";
import fs from "fs";
import posts from "./routes/post.mjs";
import userstuff from "./routes/userroutes.js";
import helmet from "helmet";
import cors from "cors";
import { connectToDatabase, db } from './db/conn.js';

const PORT = 3001;
const app = express();

// Setting SSL options
const options = {
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
};

// Applying security headers with helmet and custom headers
app.use(helmet());
app.use((req, res, next) => {
    //set security policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");
  
    //set content x options
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevents MIME type sniffing
  
    //sets x fram options
    res.setHeader('X-Frame-Options', 'DENY'); // Prevents clickjacking by disallowing iframes
  
    //sets xxxss protection
    res.setHeader('X-XSS-Protection', '1; mode=block'); // Enables XSS filtering
  
    //sets referer policy
    res.setHeader('Referrer-Policy', 'no-referrer'); // Prevents the browser from sending the referrer header
  
    // sets strict transport security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // Enforces HTTPS
  
    // sets permissions policy
    res.setHeader('Permissions-Policy', "geolocation=(self), microphone=(), camera=()"); // Limits feature access
  
    //start the next middleware
    next();
});

// Setting up CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

// CORS settings
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
});

// Setting up routes
app.use("/post", posts);
app.use("/users", userstuff);

// Create the server and start it after connecting to the database
async function startServer() {
    try {
        await connectToDatabase();  // Wait for DB connection before starting the server
        let server = https.createServer(options, app);
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to the database. Server not started.", error);
    }
}

startServer(); // Start the server
