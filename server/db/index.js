import mongoose from "mongoose";


const connectDB = async() => {
    try{
      const conectionInstance=  await mongoose.connect(process.env.mongodb_uri)
      console.log("Connected to DB successfully");
      console.log("Connection Instance Host", conectionInstance.connection.host);
    }
    catch(error){
        console.log("Error in connecting to DB", error.message);
        process.exit(1); //exit current process
    }
}
export const connect = connectDB;