import { upload } from "../middleware/multer.js";
import {Router} from 'express'
import { verifyJWT } from "../middleware/authMiddleware.js";
import { changeCurrentPassword, dashboard, forgotPassword, getCurrentUser, googleCallback, googleLogin, loginUser, logout, logoutUser, passwordOTPverification, registerUser, resetPassword, sendEmailVerificationOTP, sendPhoneVerificationOTP, updateAccountDetails, updateUserAvatar, verifyEmailOTP, verifyPhoneOTP } from "../controllers/userController.js";
import verifyAdmin from "../middleware/adminMiddleware.js";
import { stripePayment } from "../controllers/productController.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        }

    ]),registerUser
)

router.route('/login').post(loginUser)

router.route('/logout').post(logoutUser)
router.route('/update-user').patch(verifyJWT,updateAccountDetails)
router.route('/change-password').post(verifyJWT,changeCurrentPassword)
router.route('/update-user-avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route('/current-user').get(verifyJWT,getCurrentUser)
router.route('/google-login').get(googleLogin)
router.route('/google-login/callback').get(googleCallback)

router.route('/google-logout').get( logout);
router.route('/dashboard').get(dashboard)

router.route('/forgot-password').post(forgotPassword)
router.route('/password-otp-verification').post(passwordOTPverification)
router.route('/reset-password').post(resetPassword)
router.route("/send-email-otp").post(verifyJWT,sendEmailVerificationOTP)
router.route("/verify-email-otp").post(verifyJWT,verifyEmailOTP)
router.route("/send-phone-otp").post(verifyJWT,sendPhoneVerificationOTP)
router.route("/verify-phone-otp").post(verifyJWT,verifyPhoneOTP)




export default router


    