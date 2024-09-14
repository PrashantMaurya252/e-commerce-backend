import { Product } from "../models/productModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary";



const addProduct = asyncHandler(async(req,res)=>{
    const {productName,productCategory,productPrice,productDescription} = req.body

    if([productName,productCategory,productPrice,productDescription].some((field)=>field.trim() === "")){
        throw new ApiError(500,"All Fields are required")
    }

    const productImageLocalPath = req.files?.productImage[0].path

    if(!productImageLocalPath){
        throw new ApiError(500,"product Image not found")
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath)

    if(!productImage){
        throw new ApiError(400,"There is an error while product image uploading on cloudinary")
    }

    const product = await Product.create({
        productName,
        productCategory,
        productImage:productImage.url,
        productDescription,
        productPrice
    })

    const createdProduct = await Product.findById(product._id)

    if(!createdProduct){
        throw new ApiError(500,"something went wrong while adding product")
    }

    return res.status(200).json(
        new ApiResponse(200,createdProduct,"product added")
    )
})