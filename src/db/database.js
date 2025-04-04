import mongoose from "mongoose";
import { DB_NAME } from "../constans.js";

const connectDB = async () => {
    try {
        const connectionInstant = await mongoose.connect(`${process.env.MONGOOSE_URL}/${DB_NAME}`)
        console.log(`\n Mongodb connected !! DB HOST : ${connectionInstant.connection.host}`);
    }
    catch (err) {
        console.log("Mongodb connection failed   :   ", err);
        process.exit(1)

    }

}



export default connectDB;

