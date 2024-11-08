const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Middleware to check authorization
const checkAuth = (req, res, next) => {
    try {
        const secret = process.env.JWT_SECRET; // Get the secret from .env
        const token = req.headers.authorization.split(" ")[1]; // Extract the token
        const decoded = jwt.verify(token, secret); // Verify the token

        req.user = decoded; // Attach the decoded token to the request object

        next(); // If the token is valid, proceed to the next middleware
    } catch (error) {
        res.status(401).json({
            message: "Token invalid: " + error.message
        });
    }
};

module.exports = checkAuth;
