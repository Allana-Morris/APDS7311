import { MongoClient } from "mongodb";
import dotenv from "dotenv"
dotenv.config();

//connection string
const connectionString = process.env.ATLAS_URI || "";

//creating new client
const client = new MongoClient(connectionString);

//try to connect to client
let conn;
try {
    conn = await client.connect();
}
catch(e) //cant connect display error
{
    console.error(e);
}

//export the database client
let db = client.db("APDSPOE");

export default db;