import express  from "express";
import dotenv from "dotenv";
import chats from "./data/dummychat.js";
import {connect} from "./db/index.js"
import cors from "cors";
import cookieParser from "cookie-parser"
import {router as userRoutes} from "./routes/user.routes.js";
dotenv.config();
const app=express();
connect();
// app.use(cors())
app.use(express.json({limit:"16kb"})) //configure for json
app.use(express.urlencoded({extended:true,limit:"16kb"})) //configure for form data
app.use(express.static("public")) //make public folder accesible
app.use(cookieParser()) //configure cookie access with server


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`); // Log the request method and URL
    console.log('Headers:', req.headers); // Optionally log headers
    console.log('Body:', req.body); // If you are expecting a body (e.g., POST requests)
    next(); // Proceed to the next middleware/route handler
  });


app.use("/api/user",userRoutes);


app.listen(process.env.PORT,()=>{
    console.log("Server is running on port ",process.env.PORT);
});