import express from "express";
//import db from "../BACKEND/db/conn.mjs";
import https from "https";
import fs from "fs";
import posts from "./routes/post.mjs"
import userstuff from "./routes/userroutes.mjs"
import helmet from "helmet";
import cors from "cors"

const PORT = 3001;
const app = express();

const options = {
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
}

app.use(helmet());
app.use((req, res, next) => {
    // Sets Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';");
  
    // Sets X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevents MIME type sniffing
  
    // Sets X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY'); // Prevents clickjacking by disallowing iframes
  
    // Sets X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block'); // Enables XSS filtering
  
    // Sets Referrer-Policy
    res.setHeader('Referrer-Policy', 'no-referrer'); // Prevents the browser from sending the referrer header
  
    // Sets Strict-Transport-Security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // Enforces HTTPS
  
    // Sets Permissions-Policy
    res.setHeader('Permissions-Policy', "geolocation=(self), microphone=(), camera=()"); // Limits feature access
  
    // Calls the next middleware
    next();
  });
app.use(cors())
app.use(express.json());

app.use((reg, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
})

app.use("/post", posts);
app.route("/post", posts)

app.use("/users", userstuff);

let server = https.createServer(options, app)

// Server listening
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});