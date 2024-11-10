const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

// Connection string
const connectionString = process.env.ATLAS_URI || "";

// Creating a new client
const client = new MongoClient(connectionString);

let db;

// Connect to MongoDB and assign `db` when the connection is successful
const connectToDatabase = client.connect()
    .then((connection) => {
        db = connection.db("APDSPOE");
        return db;  // Return the db instance for immediate use in the promise chain if needed
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    });

// Export connectToDatabase so other modules can await the connection
module.exports = connectToDatabase;
