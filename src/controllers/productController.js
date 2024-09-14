import { Product } from "../models/productModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const addProduct = asyncHandler(async(req,res)=>{
    const {productName,productCategory,productPrice,productDescription} = req.body

    if([productName,productCategory,productPrice,productDescription].some((field)=>field.trim() === "")){
        throw new ApiError(500,"All Fields are required")
    }

    const productImageLocalPath = req.file?.path

    console.log(productImageLocalPath,"product Image Local Path")

    if(!productImageLocalPath){
        throw new ApiError(500,"product Image not found")
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath)

    console.log(productImage,"productImage")

    if(!productImage){
        throw new ApiError(400,"There is an error while product image uploading on cloudinary")
    }

    const product = await Product.create({
        name:productName,
        category:productCategory,
        image:productImage.url,
        description:productDescription,
        price:productPrice
    })

    const createdProduct = await Product.findById(product._id)

    if(!createdProduct){
        throw new ApiError(500,"something went wrong while adding product")
    }

    return res.status(200).json(
        new ApiResponse(200,createdProduct,"product added")
    )
})

export {addProduct}