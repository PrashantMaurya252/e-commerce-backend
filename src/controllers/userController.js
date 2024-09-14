import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import passport from "passport";
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken'



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
 



// Configure Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure:true,
    port:465,
    auth: {
        user: process.env.MAIL_APP_GMAIL, // Your Gmail address
        pass: process.env.MAIL_APP_PASSWORD, // Your Gmail password or App password if 2FA is enabled
    },
});

// Function to send OTP email

const sendEmailNodemailer = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: 'mauryaprashant202@gmail.com', // Your email address
            to: toEmail, // Recipient email address
            subject: 'Your Password Reset OTP',
            text: `Your OTP is ${otp}. This code is valid for 10 minutes.`,
            html: `<h1>Password Reset Request</h1><p>Your OTP is <strong>${otp}</strong>.</p><p>This code is valid for 10 minutes.</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        
        return info;
    } catch (error) {
        console.error('Nodemailer error:', error.message);
        throw new ApiError(500, 'Failed to send email via Nodemailer');
    }
};






const forgotPassword = asyncHandler(async(req,res)=>{
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(401,"User not found")
    }

    try {
        

    const resetOTP = Math.round(Math.random()*10000)

    user.resetPasswordOTP =resetOTP
    user.resetPasswordExpire = Date.now() + 10*60*1000

    await user.save({validateBeforeSave:false})

    
    // await sendEmailMailjet(email) 
    await sendEmailNodemailer(email,resetOTP)
    

      
      return res.status(200).json(new ApiResponse(200),{},'Email sent')
    } catch (error) {
        console.log(error,"error")
         user.resetPasswordOTP = undefined,
         user.resetPasswordExpire = undefined
        await user.save({validateBeforeSave:false})
       
        console.log("catch block error",error)
        throw new ApiError(500,'Email could not be sent')
    }
    

    
})

const passwordOTPverification = asyncHandler(async(req,res)=>{
    const {OTP} = req.body

    

    try {
        const user = await User.findOne({resetPasswordOTP:OTP})

        if(!user){
            throw new ApiError(400,"Invalid or expire OTP")
        }

        user.resetPasswordOTP = undefined
        user.resetPasswordExpire = undefined
        await user.save({validateBeforeSave:false})

        const token = jwt.sign({userId:user._id},process.env.RESET_PASSWORD_SECRET,{expiresIn:'10m'})

        return res.status(200).json(new ApiResponse(200,token,'OTP verified successfully'))
    } catch (error) {
        throw new ApiError(500,"Error in password reset")
    }
})

const resetPassword =asyncHandler(async(req,res)=>{
    const {token,newPassword} = req.body

    try {
        const decode = jwt.verify(token,process.env.RESET_PASSWORD_SECRET)
        if(!decode){
            throw new ApiError(500,"unauthorized request")
        }

        const user = await User.findById(decode.userId)

        if(!user){
            throw new ApiError(500,"User does no exist for provided token")
        }

        user.password = newPassword
        await user.save({validateBeforeSave:false})

        return res.status(200).json(new ApiResponse(200,{},"Password Updated successfully"))
    } catch (error) {
        throw new ApiError(400,"Password reset unsuccessful")
    }
})
 export {registerUser,loginUser,logoutUser,updateAccountDetails,updateUserAvatar,getCurrentUser,changeCurrentPassword,forgotPassword,passwordOTPverification,resetPassword}

