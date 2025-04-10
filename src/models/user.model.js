import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,

        },
        fullName: {
            type: String,
            required: true,

            trim: true,
            index: true

        },
        avatar: {
            type: String,  //cloudnary url
            required: true,
        },
        coverImage: {
            type: String,  //cloudnary url

        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }

        ]
        ,
        password: {
            type: String,
            required: [true, 'password must required']

        }
        , refreshToken: {
            type: String
        }
}, {
    timestamps: true
}
)

userSchema.pre("save" , async function(next) {
    if(!this.isModified("password") ) return next()
    this.password =await bcrypt.hash(this.password , 10)
    next() 
})

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password , this.password)
    
}
userSchema.methods.generateAccessToken =function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            usename:this.usename,
            fullName :this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
    )
    
}
userSchema.methods.generateRefreshToken =function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
    )

}
export const User = mongoose.model("User", userSchema)