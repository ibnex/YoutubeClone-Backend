import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js";
import { UploadOnCouldniry } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";
// import {generateAccessToken} from '../models/user.model.js'
// import {generateRefreshToken} from '../models/user.model.js'
// import {isPasswordCorrect} from '../models/user.model.js'





const generateAccessAndrefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();

        const refreshToken = await user.generateRefreshToken();


        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}


const registerUser = asyncHandler(async (req, res) => {


    const { fullName, email, password, username } = req.body
    // console.log(email);

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
    console.log(CreatedUser);

    if (!CreatedUser) {
        throw new ApiError(500, "somthing went wrong while registering a new user")
    }


    return res.status(201).json(
        new ApiResponse(200, CreatedUser, 'User registered successfully')
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required ")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user does not exists")
    }


    const isPasswordValid = await user.isPasswordCorrect(password)


    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndrefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "user logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }


    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200, {

            },
                "user logged Out successfully"
            )
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!inComingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodeToken = jwt.verify(
            inComingRefreshToken, process.end.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodeToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (inComingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndrefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accesstoken", accessToken, options)
            .cookie("refreshtoken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "access token refreshed successfully"
                )
            )


    } catch (err) {
        throw new ApiError(401, err?.message || "invalid refresh token ")

    }


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "all fields are required ")

    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: { fullName, email }
    }, { new: true }).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, user, "account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }
    const avatar = await UploadOnCouldniry(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }


    const user = await User.findOneAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url

        }
    }, { new: true }).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar updated successfullly"))

})

const updateUsercoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is required")
    }
    const coverImage = await UploadOnCouldniry(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }


    const user = await User.findOneAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url

        }
    }, { new: true }).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverimage updated successfullly"))


})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing ")
    }


    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberdTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size :"$subscribers"
                },
                 channelSubscriberdToCount:{
                    $size:"$subscriberdTo"
                },
                isSubscribed:{
                    $cond:  {
                        if:{$in: [req.user?._id,"$subscribers.subscriber"] },
                        then :true,
                        else: false
                    }
                }
                
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                subscriberCount:1,
                channelSubscriberdToCount:1,
                isSubscribed:1,
                coverImage:1,
                email:1



            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404 , " channel does not exists")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200 , channel[0] , "user channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler (async (req , res )=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory" ,
                 pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                  
                                    }
                                }
                            ]
                    }},
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }

                    }
                 ]
            }
        }
    ])

    return res 
    .status(200)
    .json(
        new ApiResponse(200 , user[0].watchHistory ,"watch history fetch successfully")
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUsercoverImage , getUserChannelProfile , getWatchHistory}