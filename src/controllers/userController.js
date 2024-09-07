import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import passport from "passport";
import nodemailer from 'nodemailer'

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

    return res.status(200).
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

 export const googleLogin = passport.authenticate('google',{scope:['profile','email']})
 export const googleCallback = passport.authenticate('google',{failureRedirect:'/'})

 export const dashboard = (req,res) =>{
    if(req.isAuthenticated()){
        res.json({
            message:`Welcome ${req.user.fullName}`,
            user:req?.user
        })
    }else{
        res.redirect('/')
    }
 }

 export const logout = (req, res) => {
    req.logout(() => {
        res.json({ message: 'Logged out successfully' });
    });
};
 

const sendEmail = async(options) =>{
    try {
        const transport = nodemailer.createTransport({
            service:'Gmail',
            auth:{
                user:process.env.EMAIL_USER,
                pass:process.env.EMAIL_USER_PASSWORD
            }
        })
    } catch (error) {
        console.log("something went wrong with transport")
        throw new ApiError(500,error.message)
    }
   

    const mailOptions = {
        from:process.env.EMAIL_USER,
        to:options?.email,
        subject:options?.subject,
        text:options?.message
    }
    await transport.sendMail(mailOptions)
}
const forgotPassword = asyncHandler(async(req,res)=>{
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(401,"User not found")
    }

    try {
        

    const resetToken = crypto.randomBytes(20).toString('hex')

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpire = Date.now() + 10*60*1000

    await user.save()
    console.log(req,'req')

    const resetUrl = `${req.protocol}://${req.get('host')}/api/password-reset/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested a password reset. Please go to the following link to reset your password:\n\n${resetUrl}`;

    await sendEmail({
        email: user.email,
        subject: 'Password Reset',
        message
      });
      return res.status(200).json(new ApiResponse(200),{},'Email sent')
    } catch (error) {
        user.resetPasswordToken = undefined,
        user.resetPasswordExpire = undefined
        await user.save()
        console.log(error)
        console.log(error.message)
        throw new ApiError(500,'Email could not be sent')
    }
    

    
})

const resetForgottenPassword = asyncHandler(async(req,res)=>{
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire:{$gt:Date.now()}
        })

        if(!user){
            throw new ApiError(400,"Invalid or expire token")
            user.password = req.body.password;
            user.resetPasswordToken=undefined;
            user.resetPasswordExpire=undefined;

            await user.save()

            return res.status(200).json(new ApiResponse(200,{},'Password reset successful'))
        }
    } catch (error) {
        throw new ApiError(500,"Error in password reset")
    }
})
 export {registerUser,loginUser,logoutUser,updateAccountDetails,updateUserAvatar,getCurrentUser,changeCurrentPassword,forgotPassword,resetForgottenPassword}

