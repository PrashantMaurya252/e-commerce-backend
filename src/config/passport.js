import passport from "passport";
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";

passport.use(
    new GoogleStrategy(
        {
            clientID:process.env.GOOGLE_CLIENT_ID,
            clientSecret:process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:process.env.GOOGLE_CALLBACK_URL
        },
        async(accessToken,profile,refreshToken,done)=>{
            try {
                const user = await User.findOne({email:profile.emails[0].value})

                if(user){
                    return done(null,user)
                }

                user = new User({
                    username: profile.displayName.split(' ').join('').toLowerCase(),
                    email: profile.emails[0].value,
                    fullName: profile.displayName,
                    avatar: profile.photos[0].value,
                    password: ''
                })

                await user.save({validateBeforeSave:false})
                done(null,user)

                passport.serializeUser((user,done)=>{
                    done(null,user)
                })

                passport.deserializeUser(async(id,done)=>{
                    try {
                        const user = await User.findById(id)
                        done(null,user)
                    } catch (error) {
                        done(error,null)
                    }
                })
            } catch (error) {
                throw new ApiError(400,"Something went wrong with google register-api")
            }
        }
    )
)