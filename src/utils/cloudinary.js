import { v2 as cloudinary} from "cloudinary";
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.cloud_name ,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})



const UploadOnCouldniry= async(localfile)=>{
    try{
            if(!localfile) return null;
            const response = await cloudinary.uploader.upload(localfile,{
                resource_type:"auto"
            })
            // console.log("file upload successfully ",response.url);
            fs.unlinkSync(localfile)
            return response;
    }
    catch(error){
        fs.unlinkSync(localfile)
        return null;
         
    }

}

export {UploadOnCouldniry}