import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import FormData from 'form-data';
import multer from 'multer';

dotenv.config();

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
const GOOGLE_CLOUD_BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME;


// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
});
const bucket = storage.bucket(GOOGLE_CLOUD_BUCKET_NAME);

// Try multiple APIs in order of preference
const tryRemoveBackground = async (imagePath, originalFormat) => {
    const apis = [
        { name: 'Remove.bg', func: removeBackgroundWithRemoveBg },
        { name: 'PhotoRoom', func: removeBackgroundWithPhotoRoom },
        { name: 'Clipdrop', func: removeBackgroundWithClipdrop }
    ];

    for (const api of apis) {
        try {
            const result = await api.func(imagePath, originalFormat);
            return result;
        } catch (error) {
            // If it's a credit/payment error, try next API
            if (error.response && (error.response.status === 402 || error.response.status === 429)) {
                continue;
            }
            // For other errors, also try next API
            continue;
        }
    }

    // If all APIs failed due to credit/payment issues, return specific error
    const error = new Error('CREDITS_EXHAUSTED: All cloud background removal services have reached their usage limits. Client-side processing recommended.');
    error.code = 'CREDITS_EXHAUSTED';
    throw error;
};

// Remove.bg API implementation
const removeBackgroundWithRemoveBg = async (imagePath, originalFormat) => {
    if (!REMOVE_BG_API_KEY) {
        throw new Error('Remove.bg API not configured');
    }

    const formData = new FormData();
    formData.append('image_file', fs.createReadStream(imagePath));
    formData.append('size', 'auto'); // Use highest quality
    formData.append('type', 'auto'); // Auto-detect subject type
    formData.append('type_level', '2'); // Higher precision
    formData.append('format', 'png'); // Ensure PNG output for transparency
    formData.append('channels', 'rgba'); // Include alpha channel

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
        headers: {
            'X-Api-Key': REMOVE_BG_API_KEY,
            ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
    });

    return response.data;
};

// PhotoRoom API implementation (free alternative)
const removeBackgroundWithPhotoRoom = async (imagePath, originalFormat) => {
    // PhotoRoom API - 100 free images per month
    // To use this, sign up at https://www.photoroom.com/api/ and get a free API key
    // Then add PHOTOROOM_API_KEY to your .env file

    const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY;
    if (!PHOTOROOM_API_KEY) {
        throw new Error('PhotoRoom API key not configured');
    }

    const formData = new FormData();
    formData.append('image_file', fs.createReadStream(imagePath));

    const response = await axios.post('https://sdk.photoroom.com/v1/segment', formData, {
        headers: {
            'x-api-key': PHOTOROOM_API_KEY,
            ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
    });

    return response.data;
};

// Clipdrop API implementation (free alternative)
const removeBackgroundWithClipdrop = async (imagePath, originalFormat) => {
    // Clipdrop API implementation would go here
    // For now, throw error to skip to next API
    throw new Error('Clipdrop API not implemented yet');
};

export const removeBackground = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

  
        const imagePath = req.file.path;
        const originalFormat = path.extname(req.file.originalname).toLowerCase();
        const outputFormat = '.png'; // Always output PNG for background removal (transparency support)
       
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: "Uploaded file not found" });
        }

        // Validate image file
        const stats = fs.statSync(imagePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        // Check file size (Remove.bg has limits)
        if (fileSizeInMB > 12) {
            return res.status(400).json({ error: "Image file is too large. Please use an image smaller than 12MB." });
        }

        // Check minimum file size (very small files usually don't work well)
        if (fileSizeInMB < 0.01) {
            return res.status(400).json({ error: "Image file is too small. Please use a larger image." });
        }

        // Validate input file format
        const allowedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowedFormats.includes(originalFormat)) {
            return res.status(400).json({ error: `Unsupported image format. Please use: ${allowedFormats.join(', ')}` });
        }



        // Try multiple APIs with fallback
        const processedImageData = await tryRemoveBackground(imagePath, originalFormat);


        // Background removal APIs always return PNG format (for transparency)
        // So we should save as PNG regardless of input format
        const baseFileName = path.basename(req.file.filename, originalFormat);
        const outputFileName = `processed-${baseFileName}${outputFormat}`;
        const outputPath = `uploads/${outputFileName}`;


        fs.writeFileSync(outputPath, processedImageData);

        // Upload to Google Cloud Storage with correct PNG content type
        const cloudFile = bucket.file(outputFileName);
        await cloudFile.save(processedImageData, {
            metadata: {
                contentType: 'image/png',
                cacheControl: 'public, max-age=3600'
            },
        });

      
        const [url] = await cloudFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour expiry
        });

        // Cleanup local files
        fs.unlinkSync(imagePath);
        fs.unlinkSync(outputPath);

        // Return success response with proper PNG format
        const BASE_URL = process.env.BASE_URL || 'https://imagepro-8fxb.onrender.com';
        const downloadUrl = `${BASE_URL}/api/image/download/${outputFileName}`;

        res.json({
            fileUrl: url,
            downloadUrl: downloadUrl,
            url: url, // For backward compatibility (signed URL for preview)
            message: 'Background removed successfully',
            filename: outputFileName,
            format: 'PNG',
            contentType: 'image/png'
        });
     } catch (error) {
        console.error('Error removing background:', error);

        // Handle specific Remove.bg API errors
        if (error.response) {
            const errorData = error.response.data;
            console.error('Remove.bg API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: errorData.toString ? errorData.toString() : errorData
            });

            // Parse error message if it's a buffer or string
            let errorMessage = "Error processing image";
            let errorText = '';

            if (Buffer.isBuffer(errorData)) {
                errorText = errorData.toString('utf8');
            } else if (typeof errorData === 'string') {
                errorText = errorData;
            }

            if (errorText) {
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('Parsed error:', errorJson);

                    if (errorJson.errors && errorJson.errors.length > 0) {
                        const firstError = errorJson.errors[0];

                        if (firstError.code === 'insufficient_credits' || firstError.title.includes('Insufficient credits')) {
                            errorMessage = "Background removal service has reached its usage limit. Please try again later or contact support for more processing credits.";
                        } else if (firstError.title.includes('Could not identify foreground')) {
                            errorMessage = "Could not identify a clear subject in the image. Please try an image with a more distinct foreground object.";
                        } else if (firstError.title.includes('Insufficient image resolution')) {
                            errorMessage = "Image resolution is too low. Please use a higher quality image.";
                        } else if (firstError.title.includes('Invalid API key')) {
                            errorMessage = "API configuration error. Please try again later.";
                        } else {
                            errorMessage = firstError.title || "Error processing image";
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing Remove.bg error response:', parseError);
                    // If it's a 402 status, it's likely a credit issue
                    if (error.response.status === 402) {
                        errorMessage = "Background removal service has reached its usage limit. Please try again later.";
                    }
                }
            } else if (error.response.status === 402) {
                errorMessage = "Background removal service has reached its usage limit. Please try again later.";
            }

            return res.status(500).json({ error: errorMessage });
        }

        // Handle specific error codes
        if (error.code === 'CREDITS_EXHAUSTED') {
            return res.status(402).json({
                error: error.message,
                code: 'CREDITS_EXHAUSTED',
                useClientSide: true
            });
        }

        if (error.code === 'ENOTFOUND') {
            return res.status(500).json({ error: "Network error. Please check your internet connection." });
        }

        return res.status(500).json({ error: "Error processing image. Please try again." });
}
};
