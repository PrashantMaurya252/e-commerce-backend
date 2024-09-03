import { upload } from "../middleware/multer.js";
import {Router} from 'express'
import { verifyJWT } from "../middleware/authMiddleware.js";
import { changeCurrentPassword, dashboard, getCurrentUser, googleLogin, loginUser, logout, logoutUser, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/userController.js";

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

router.route('/logout').post(verifyJWT,logoutUser)
router.route('/update-user').patch(verifyJWT,updateAccountDetails)
router.route('/change-password').post(verifyJWT,changeCurrentPassword)
router.route('/update-user-avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route('/current-user').get(verifyJWT,getCurrentUser)
router.route('/google-login').get(googleLogin)
router.route('/google-login/callback')

router.route('/google-logout').get( logout);
router.route('/dashboard',dashboard)

export default router
