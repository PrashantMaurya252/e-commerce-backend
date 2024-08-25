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
    avatar:{
        type:String,
        required:true
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
    return await bcrypt.compare(this.password,password)
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