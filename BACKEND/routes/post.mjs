import express from "express";
//import db from "../db/conn.mjs"
import { ObjectId } from "mongodb";

const router = express.Router();

//get all records apparently
router.get("/", async(req, res)=>{
 /*  let collection = await db.collection("posts");
    let results = await collection.find({}).toArray();
    res.send(results).status(200)*/
res.status(200).send("No database used here. Just a simple message.");

});

export default router;


