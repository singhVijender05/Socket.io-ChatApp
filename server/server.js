import express  from "express";
import dotenv from "dotenv";
import chats from "./data/dummychat.js";
import {connect} from "./db/index.js"
import cors from "cors";
dotenv.config();
const app=express();
connect();
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World");
});

app.get("/chat",(req,res)=>{
    res.send(chats);
})

app.listen(process.env.PORT,()=>{
    console.log("Server is running on port ",process.env.PORT);
});