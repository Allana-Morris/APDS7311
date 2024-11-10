import express from "express";
import db from "../db/conn.js"

//create router
const router = express.Router();


//get all records for testing
router.get("/", async(req, res)=>{
  let collection = await db.collection("posts");
    let results = await collection.find({}).toArray();
    res.send(results).status(200)
//res.status(200).send("No database used here. Just a simple message.");

});


export default router;


