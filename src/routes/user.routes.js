import { Router } from "express";
import { registerUser  , loginUser, logoutUser ,refreshAccessToken} from "../controllers/user.controller.js";
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


router.route("/logout").post(verifyJWT ,  logoutUser)

 
    // router.route("/register").get(
    //      (req, res) => {
    //         res.json(data);
    //       })


export default router;