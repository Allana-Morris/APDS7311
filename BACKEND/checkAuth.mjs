import jwt from "jsonwebtoken";
import dotenv from 'dotenv';


dotenv.config(); //load environment variables

//method to ensure authorised user 
const checkAuth = (req, res, next) => {
    try {
        const secret = process.env.JWT_SECRET; //get the secret from .env
        const token = req.headers.authorization.split(" ")[1]; //  extract the token
        const decoded = jwt.verify(token, secret); //verify the token using your secret key from the dotEnv
        
        req.user = decoded; //send the decoded token
        
        next(); //if all is cool and valid we move one
    } catch (error) {
        //token is invalid so send an error
        res.status(401).json({
            message: "Token invalid: " + error.message // Provide more context on the error
        });
    }
};

export default checkAuth;
