import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDNIARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:auto
        })

        console.log(response)
        console.log(localFilePath)
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath)
        }else{
            console.log("File does not exist to delete")
        }

        return response
    } catch (error) {
        console.log(error,"cloudniary error")
        console.log(localFilePath,"catch")
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath)
        }else{
            console.log("No file present to delete")
        }
        return null
    }
}

export {uploadOnCloudinary}