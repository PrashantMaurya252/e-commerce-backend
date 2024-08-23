import mongoose from "mongoose";

async function connectDB(){
    try {
        await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log("Running Properly")
    } catch (error) {
        console.log("MongoDB Error",error)
        process.exit(1)
    }
}