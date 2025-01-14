import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import userRouter from './routes/userRoutes.js'
import productRouter from './routes/productRoutes.js'


const app =express()


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
    
    
}))
// app.use(cors())

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())


app.use("/api/v1/users",userRouter)
app.use("/api/v1/products",productRouter)

export {app}