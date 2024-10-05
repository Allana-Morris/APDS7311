import { MongoClient } from "mongodb";
import dotenv from "dotenv"
dotenv.config();

const connectionString = process.env.ATLAS_URI || "";

console.log(connectionString);

const client = new MongoClient(connectionString);

let conn;
try {
    conn = await client.connect();
    console.log("mongo is connected");
}
catch(e)
{
    console.error(e);
}

let db = client.db("APDSPOE");

export default db;