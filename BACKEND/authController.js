const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // You can use bcrypt to hash and compare passwords
const User = require('./models/User'); // Assuming you have a User model to interact with your database

dotenv.config();

const authenticateUser = async (credentials) => {
    const { username, password } = credentials;

    // Find the user in the database
    const user = await User.findOne({ username });
    if (!user) {
        return false; // User not found
    }

    // Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return false; // Invalid password
    }

    // If the user is valid, generate a JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return token; // Return the token
};

module.exports = { authenticateUser };
