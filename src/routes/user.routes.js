import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUsercoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from '../Middlewares/multer.middleware.js'
import { verifyJWT } from "../Middlewares/auth.middleware.js";

const router = Router()



router.route("/register").post(
    upload.fields([{
        name: 'avatar',
        maxCount: 1
    },

    {
        name: 'coverImage',
        maxCount: 1
    }]),

    registerUser)


router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/changed-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


// router.route("/register").get(
//      (req, res) => {
//         res.json(data);
//       })


export default router;