import dotenv from 'dotenv'
import connectDB from './src/db/connectDB.js'
import { app } from './app.js'

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,() => {
        console.log(`server is running at port ${process.env.PORT}`)
        app.on('error',()=>{
            console.log("ERROR",error)
            throw error
        })
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed !!!",err)
})