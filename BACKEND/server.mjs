import express from "express";
//import db from "../BACKEND/db/conn.mjs";
import https from "https";
import fs from "fs";
import posts from "./routes/post.mjs"
import users from "./models/User.mjs"; 
import cors from "cors"

const PORT = 3001;
const app = express();

const options = {
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
}

app.use(cors())
app.use(express.json());

app.use((reg, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','*');
    res.setHeader('Access-Control-Allow-Methods','*');
    next();
})

app.use("/post", posts);
app.route("/post", posts)

app.use("/user", users);

let server = https.createServer(options, app)

// Server listening
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});