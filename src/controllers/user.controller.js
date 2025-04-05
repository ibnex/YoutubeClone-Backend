import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { UploadOnCouldniry } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {


    const { fullName, email, password, username } = req.body
    console.log(email);

    if (fullName == "") {
        throw new ApiError(400, "full name is required")
    }
    if (username == "") {
        throw new ApiError(400, "username is required")
    }
    if (password == "") {
        throw new ApiError(400, "password is required")
    }
    if (email == "") {
        throw new ApiError(400, "email is required")
    }
    if (!email.endsWith("@gmail.com")) {
        throw new ApiError(400, "email is wrong")
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]

    }
    )
    if (existedUser) {
        throw new ApiError(409, "email or username already exists")
    }


    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }

    const avatar = await UploadOnCouldniry(avatarLocalPath)
    const coverImage = await UploadOnCouldniry(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "avatar filed is required")
    }

    const newUser = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const CreatedUser = await User.findById(newUser._id).select("-password -refreshToken")

    if (!CreatedUser) {
        throw new ApiError(500, "somthing went wrong while registering a new user")
    }


    return res.status(201).json(
        new ApiResponse(200, CreatedUser, 'User registered successfully')
    )
})

export { registerUser }