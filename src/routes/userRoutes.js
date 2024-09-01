import { upload } from "../middleware/multer";
import {Router} from 'express'
import { verifyJWT } from "../middleware/authMiddleware";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/userController";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name:updateUserAvatar,
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

export default router
