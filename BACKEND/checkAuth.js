const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Middleware to check authorization
const checkAuth = (req, res, next) => {
    try {
        const secret = process.env.JWT_SECRET; // Get the secret from .env
        const token = req.headers.authorization && req.headers.authorization.split(" ")[1]; // Extract the token
        
        if (!token) {
            // Handle the case when no token is provided
            return res.status(401).json({
                message: 'Token required'
            });
        }

        // Verify the token using jwt.verify
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                // If jwt verification fails, return 401 with a specific message
                return res.status(401).json({
                    message: `Token invalid: ${err.message}`
                });
            }

            req.user = decoded; // Attach the decoded token to the request object
            next(); // If the token is valid, proceed to the next middleware
        });
    } catch (error) {
        // If any unexpected error occurs
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = checkAuth;
