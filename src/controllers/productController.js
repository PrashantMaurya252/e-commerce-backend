import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
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

    

    if(!productImageLocalPath){
        throw new ApiError(500,"product Image not found")
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath)
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

const markFavourite = asyncHandler(async(req,res)=>{
    const userId = req.user

    const productId = req.params.productId

    const product = await Product.findById(productId)
    if(!product){
        throw new ApiError(500,"Product does not exist")
    }

    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(400,"User does not exist")
    }
    const isFavourite = await user.favourites.some(fav => fav.item.toString() === productId)
    if(isFavourite){
        throw new ApiError(400,"This Product already mark favourite")
    }

    user.favourites.push({
        item:productId,
        addedAt:Date.now()
    })

    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,user.favourites,"Product mark as favourite"))
})

const markUnFavourite = asyncHandler(async(req,res)=>{
    const productId = req.params.productId
    const userId = req.user

    const product = await Product.findById(productId)
    if(!product){
        throw new ApiError(404,"Product does not exist")
    }

    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
     const isFavourite = await user.favourites.some(fav => fav.item.toString() === productId)

     if(!isFavourite){
        throw new ApiError(400,"This product is not marked favourite")
     }

     user.favourites = user.favourites.filter(filter =>filter.item.toString() !== productId )

     await user.save({validateBeforeSave:false})

     return res.status(200).json(new ApiResponse(200,user.favourites,"product unmarked successfully"))
})

const getFavouriteProducts = asyncHandler(async(req,res)=>{
    const userId = req.user._id

    const user = await User.findById(userId).populate(
        {
            path:'favourites.item',
            model:'Product',
            select:'name category image description price'
        }
    )

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const favouriteProducts = await user.favourites.map(fav => fav.item)
    

    return res.status(200).json(new ApiResponse(200,favouriteProducts,"Favourite products request successful"))
})

export {addProduct,markFavourite,markUnFavourite,getFavouriteProducts}