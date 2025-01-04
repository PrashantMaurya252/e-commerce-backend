import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:false,
        unique:true,
        lowercase:true,
        index:true,
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
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.sendingEmailVerificationOTP=async function(nodeMailerTransporter){
    const otp = Math.floor(100000 + Math.random()*900000)
    this.emailVerificationOTP = otp
    this.emailVerificationOTP = Date.now() +180000

    const mailOption = {
        from:process.env.MAIL_APP_GMAIL,
        to:this.email,
        subject:"Email Verification OTP",
        message:`Your OTP for email verification is ${otp} an this will expire in 3 minutes`
    }

    await nodeMailerTransporter.sendMail(mailOption)
}


export const User = mongoose.model("User",userSchema)