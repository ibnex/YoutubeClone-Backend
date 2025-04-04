import 'dotenv/config';
import { app } from './app.js';

import connectDB from "./db/database.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT ,()=>{
        console.log(`server is runing on ${process.env.PORT}`);
    })

})
.catch((err)=>{
    console.log("enable to connect Port in index.js :  " ,err);

})
