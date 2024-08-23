import { Schema } from "mongoose";
import mongoose from "mongoose";


const productSchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    description:{
        type:String
    },
    image:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

export const Product = mongoose.model("Product",productSchema)

