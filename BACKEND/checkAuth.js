const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Method to ensure authorized user
const checkAuth = (req, res, next) => {
    try {
        const secret = process.env.JWT_SECRET; // Get the secret from .env
        const token = req.headers.authorization.split(" ")[1]; // Extract the token
        const decoded = jwt.verify(token, secret); // Verify the token using your secret key from dotenv

        req.user = decoded; // Attach the decoded token to the request object

        next(); // If all is valid, proceed to the next middleware
    } catch (error) {
        // Token is invalid, send an error response
        res.status(401).json({
            message: "Token invalid: " + error.message // Provide more context on the error
        });
    }
};

module.exports = checkAuth;
