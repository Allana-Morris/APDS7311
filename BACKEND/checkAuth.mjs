import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const checkAuth = (req, res, next) => {
    try {
        const secret = process.env.JWT_SECRET; // Get the secret from .env
        const token = req.headers.authorization.split(" ")[1]; // Correctly extract the token
        const decoded = jwt.verify(token, secret); // Verify the token using your secret key
        
        req.user = decoded; // Attach the decoded token to the request object
        
        next(); // If token is valid, proceed to the next middleware
    } catch (error) {
        res.status(401).json({
            message: "Token invalid: " + error.message // Provide more context on the error
        });
    }
};

export default checkAuth;
