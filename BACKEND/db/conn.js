const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

// Connection string
const connectionString = process.env.ATLAS_URI || "";

// Creating a new client
const client = new MongoClient(connectionString);

let db;

// Connect to MongoDB and assign `db` when the connection is successful
const connectToDatabase = client.connect()
    .then((connection) => {
        console.log("Connected to MongoDB");
        db = connection.db("APDSPOE");
        return db;  // Return the db instance for immediate use in the promise chain if needed
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    });

// Export a function to get the database instance, `db`, once connected
module.exports = async () => {
    if (!db) {
        // Wait for the connection to complete if `db` is not yet set
        await connectToDatabase;
    }
    return db;
};