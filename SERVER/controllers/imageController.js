import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import Image from "../models/Imagemodel.js";

dotenv.config();

// Initialize Google Cloud Storage (skip in CI environment)
let storage = null;
if (process.env.NODE_ENV !== 'test' && process.env.GOOGLE_CLOUD_PROJECT_ID !== 'dummy-project') {
    storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n') // Fix newlines in the private key
        }
    });
}
 
const bucket = storage ? storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME) : null;


/**
 * Compress and upload an image file to Google Cloud Storage.
 * @param {Object} file - The file object from Multer (req.file).
 * @param {number} quality - The quality level for compression.
 * @returns {Promise<string>} - A promise that resolves to the public URL of the uploaded image.
 */

export const compressAndUploadImage = async(file,quality,email) =>{
    if(!file){
        throw new Error("No file uploaded");
    }
    const originalFormat=file.mimetype.split("/")[1];
    const validFormats=["jpeg","jpg","png","webp"];

    if(!validFormats.includes(originalFormat)){
        throw new Error("Unsupported image format .supported formats:jpeg,jpg,png,webp");

    }
    try{
    // Enhanced compression with better quality settings
    let sharpInstance = sharp(file.buffer);

    // Apply format-specific optimizations
    if (originalFormat === "jpg" || originalFormat === "jpeg") {
        sharpInstance = sharpInstance.jpeg({
            quality: parseInt(quality) || 50,
            progressive: true,
            mozjpeg: true // Better compression algorithm
        });
    } else if (originalFormat === "png") {
        sharpInstance = sharpInstance.png({
            quality: parseInt(quality) || 50,
            compressionLevel: 6,
            adaptiveFiltering: true
        });
    } else if (originalFormat === "webp") {
        sharpInstance = sharpInstance.webp({
            quality: parseInt(quality) || 50,
            effort: 6 // Higher effort for better compression
        });
    }

    const compressedImage = await sharpInstance.toBuffer();

    // Get compressed file size
    const compressedSize = compressedImage.length;

    const filename=`compressed-${uuidv4()}.${originalFormat === "jpeg" ? "jpg" :originalFormat}`;

    // Skip Google Cloud Storage in CI environment
    if (!bucket || process.env.NODE_ENV === 'test') {
        console.log('⚠️ Skipping Google Cloud Storage upload in CI environment');
        return {
            filename,
            fileUrl: `https://imagepro-8fxb.onrender.com/test-image/${filename}`,
            originalSize: file.size,
            compressedSize,
            compressionRatio: ((file.size - compressedSize) / file.size * 100).toFixed(2)
        };
    }

    const gcsFile = bucket.file(filename);

    const stream = gcsFile.createWriteStream({
        resumable:false,
        contentType:file.mimetype,
    });
    return new Promise((resolve,reject) =>{
        stream.on("error",(err)=>{
            console.error("Error uploading to GCS:",err);
            reject(err);
        });

        stream.on("finish",async()=>{
            try{
                const [signedUrl]=await gcsFile.getSignedUrl({
                    action:'read',
                    expires:Date.now()+10*60*1000,
                });

                if (!signedUrl) {
                    throw new Error("Signed URL generation failed");
                }

                await Image.create({
                    userEmail: email,  // Save the email with the uploaded image data
                    fileUrl: signedUrl,
                    createdAt: new Date(),
                });

                // Return URL, compressed size, and filename
                resolve({
                    fileUrl: signedUrl,
                    compressedSize: compressedSize,
                    filename: filename
                });
            }catch (err){
                console.error("Error making file public:",err);
                reject(err);
            }
        });
        stream.end(compressedImage);
    });
}catch (error) {
    console.error("Error compressing and uploading image:", error);
    throw new Error("Error compressing and uploading image");
}
};

/**
 * Get upload history for a specific user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */


export const getUserUploadHistory = async(req,res)=>{
try{
    const{email}=req.params;
    if(!email){
        return res.status(400).json({message:"emails required"});

    }

        // Fetch images from DB
        const images=await Image.find({userEmail:email}).sort({uploadedAt:-1});

        if (images.length === 0) {
            return res.status(404).json({ message: "No upload history found for this email" });
        }
        res.status(200).json(images);

}catch(error){
    console.error("Error fetching upload history",error);
    res.status(500).json({message:"error fetching history"});
}
};