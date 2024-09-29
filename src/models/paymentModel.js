import mongoose from "mongoose";
import { Schema } from "mongoose";

const paymentSchema = new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    products:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required:true
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ],
    amount:{
        type:Number,
        required:true
    },
    paymentIntentId:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['pending','completed','failed'],
        default:'pending'
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

export const Payment = mongoose.model("Payment",paymentSchema)
