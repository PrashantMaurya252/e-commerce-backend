import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/userModel";
import { uploadOnCloudinary } from "../utils/cloudinary";

const generateAccessToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()

        await user.save({validateBeforeSave:false})
        return {accessToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    const {username,fullName,email,password} = req.body
    if([fullName,username,email,password].some((field)=>field.trim() === "")){
        throw new ApiError(409,"All fields are required")
    }

    const existedUser = await User.findOne({$or:[{email},{username}]})
    if(existedUser){
        throw new ApiError(500,"user with same username or email already existed")
    }

    const avatarLocalPath = req.files?.avatar[0].path

if(!avatarLocalPath){
    throw new ApiError(500,"avatar image is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)

if(!avatar){
    throw new ApiError(500,"Avatar image is required")
}

console.log(avatar,"avatar")

const user = await User.create({
    fullName,
    avatar:avatar.url,
    email,
    username:username.toLowerCase(),
    password,
})

const createdUser = await User.findById(user._id).select("-password")

if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering user")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User created successfully")
)
})


const loginUser = asyncHandler(async(req,res)=>{
    const {username,email,password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({$or:[{email},{username}]})

    if(!user){
        throw new ApiError(401,"user does not exist")
    }

    const isValidPassword = await user.isPasswordCorrect(password)

    if(!isValidPassword){
        throw new ApiError(404,"Invalid credentials")
    }

    const {accessToken} = await generateAccessToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password")

    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200).
    cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,{
        user:loggedInUser,accessToken
    },"user logged in successfully"))
})

const logoutUser = asyncHandler(async(req,res)=>{
    const options ={
        httpOnly:true,
        secure:true
    }

    return res.staus(200).
    clearCookie("accessToken",options).
    json(new ApiResponse(200,{},"User Logout successfully"))
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid credentials")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"Password Change successfully"))
 })

 const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req?.user,"current user found successfully"))
 })

 const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(
       new ApiResponse(200,user,"Account Details Updated Successfully")
    )
 })

 const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req?.files.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Something went wrong while uploading")
    }

    const user = await User.findByIdAndUpdate(req?.user._id,
        {
            $set:{
                avatar:avatar?.url
            }
        },{new:true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"user image updated successfully"))
 })

