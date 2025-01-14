import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import  Twilio  from "twilio";


const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:false,
        
        lowercase:true,
        
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    fullName:{
        type:String,
        required:false,
        trim:true,
        index:true
    },
    phoneNumber:{
        type:Number,
        required:false,
        
    },
    address:{
        type:String,
        required:false,
        
    },
    avatar:{
        type:String,
        default:'N/A'
    },
    password:{
        type:String,
        required:[true,"Pasword is required"]
    },

    isAdmin:{
        type:Boolean,
        default:false
    },
    isSeller:{
        type:Boolean,
        default:false
    },
    resetPasswordOTP: Number,
    resetPasswordExpire: Date,
    phoneVerificationOTP:Number,
    phoneVerificationOTPExpire:Date,
    isPhoneVerified:{
        type:Boolean,
        default:false
    },
    isEmailVerified:{
        type:Boolean,
        default:false
    },
    emailVerificationOTP:Number,
    emailVerifyOTPExpire:Date,
    favourites:[
        {
            item:{
                type:Schema.Types.ObjectId,
                ref:"Product"

            },
            addedAt:{
                type:Date,
                required:true,
                default:Date.now
            }
        }
    ],
    cart:[
        {
            item:{
                type:Schema.Types.ObjectId,
                ref:"Product"
            },
            quantity:{
                type:Number,
                required:true,
                default:1
            },
            addedAt:{
                type:Date,
                required:true,
                default:Date.now
            }
        }
    ]
},
{
    timestamps:true
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken =  function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.sendingEmailVerificationOTP=async function(nodeMailerTransporter){
    const otp = Math.floor(100000 + Math.random()*900000)
    this.emailVerificationOTP = otp
    this.emailVerifyOTPExpire = Date.now() +180000

    const mailOption = {
        from:process.env.MAIL_APP_GMAIL,
        to:this.email,
        subject:"Email Verification OTP",
        message:`Your OTP for email verification is ${otp} an this will expire in 3 minutes`
    }

    await nodeMailerTransporter.sendMail(mailOption)
}

userSchema.methods.verifyEmailOTP = async function(otp){
    if(this.emailVerificationOTP === otp && Date.now() < this.emailVerifyOTPExpire){
        this.isEmailVerified = true
        this.emailVerificationOTP = null
        this.emailVerifyOTPExpire = null
        return true
    }
    return false
}

userSchema.methods.sendingPhoneVerificationOTP = async function(){
    const otp = Math.floor(100000 + Math.random()*9000000)
    this.phoneVerificationOTP = otp
    this.phoneVerificationOTPExpire = Date.now() + 180000

    const twilioClient = Twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_AUTH_TOKEN
    )

    await twilioClient.messages.create({
        body:`Your OTP for phone verification is ${otp}. It will expires in 3 minutes.`,
        from:process.env.TWILIO_PHONE_NUMBER,
        to:this.phoneNumber
    })
}

userSchema.methods.verifyPhoneOTP = async function(otp){
    if(this.phoneVerificationOTP === otp && Date.now() < phoneVerificationOTPExpire){
        this.isPhoneVerified = true
        this.phoneVerificationOTP = null
        this.phoneVerificationOTPExpire = null
        return true
    }
    return false
}

userSchema.pre("save",function(next){
    this.isVerified = this.isEmailVerified && this.isPhoneVerified
    next()
})


export const User = mongoose.model("User",userSchema)