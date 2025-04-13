import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    subscriber: {
        type: Schema.Types.ObjectId, // one who is subcribing 
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // channel
        ref: "User"
    }

},
 {
    timestamps: true
})

export const subscription = mongoose.model("subscription", subscriptionSchema)