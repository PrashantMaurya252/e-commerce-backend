import { Schema } from "mongoose";
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


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
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    }
},{
    timestamps:true
})

productSchema.plugin(mongooseAggregatePaginate)

export const Product = mongoose.model("Product",productSchema)

