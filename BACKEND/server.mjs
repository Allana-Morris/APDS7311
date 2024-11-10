import express from "express";
import https from "https";
import fs from "fs";
import posts from "./routes/post.mjs"
import userstuff from "./routes/userroutes.js"
import helmet from "helmet";
import cors from "cors"

//seting port and express
const PORT = 3001;
const app = express();

//setting ssl
const options = {
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
}

//applying helmet
app.use(helmet());
app.use((req, res, next) => {
    //set security policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';");
  
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

  //setting cors aand express
app.use(cors())
app.use(express.json());

//cors settings
app.use((reg, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
})

//setting our routes
app.use("/post", posts);
app.route("/post", posts)

app.use("/users", userstuff);
app.route("/users", userstuff);

//creating the server with all app options
let server = https.createServer(options, app)

//set the server to listen on our port
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});