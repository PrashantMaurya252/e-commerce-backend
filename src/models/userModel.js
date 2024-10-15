import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
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
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    phoneNumber:{
        type:Number,
        required:true,
        
    },
    address:{
        type:String,
        required:true,
        
    },
    avatar:{
        type:String,
        default:'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YXZhdGFyfGVufDB8fDB8fHww'
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


export const User = mongoose.model("User",userSchema)