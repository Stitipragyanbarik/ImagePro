import sharp from "sharp";
import ImageModel from"../models/Imagemodel.js";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
});
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);


export const convertImageFormat = async(File,format,email = null)=>{
    try{
        const allowedFormats = ["jpeg","png","webp","avif"];

        if(!allowedFormats.includes(format)){
            throw new Error("Invalid format selected");
        }
        const newFileName=`converted-${Date.now()}.${format}`;

        // Enhanced conversion with high quality settings
        let sharpInstance = sharp(File.buffer);

        // Apply format-specific high-quality settings
        if (format === "jpeg") {
            sharpInstance = sharpInstance.jpeg({
                quality: 95, // High quality for conversion
                progressive: true,
                mozjpeg: true
            });
        } else if (format === "png") {
            sharpInstance = sharpInstance.png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false // Preserve full color depth
            });
        } else if (format === "webp") {
            sharpInstance = sharpInstance.webp({
                quality: 95, // High quality for conversion
                effort: 6,
                lossless: false
            });
        } else if (format === "avif") {
            sharpInstance = sharpInstance.avif({
                quality: 90,
                effort: 6
            });
        }

        const convertedBuffer = await sharpInstance.toBuffer();

        const blob=bucket.file(newFileName);
        const blobStream=blob.createWriteStream({
            metadata:{contentType:`image/${format}`},
        });
        blobStream.end(convertedBuffer);

        return new Promise((resolve, reject) => {
            blobStream.on("finish",async()=>{
                try {
                    // Generate signed URL (same as compressor)
                    const [signedUrl] = await blob.getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 10*60*1000, // 10 minutes
                    });

                    // Only save to database if user is logged in
                    if (email) {
                        const image=new ImageModel({userEmail:email,fileUrl:signedUrl,format});
                        await image.save();
                    }

                    // Return both fileUrl and filename for download endpoint
                    resolve({
                        fileUrl: signedUrl,
                        filename: newFileName
                    });
                } catch (err) {
                    console.error("Error generating signed URL:",err);
                    reject(new Error("Failed to generate signed URL"));
                }
            });
            blobStream.on("error",(err)=>{
                console.error("Upload error:",err);
                reject(new Error("upload failed"));
            });
        });

    }catch(error){
        console.error("conversion error:",error);
        throw error;
    }
}