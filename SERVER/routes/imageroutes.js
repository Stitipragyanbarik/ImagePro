import express from"express";
import { compressAndUploadImage,getUserUploadHistory } from "../controllers/imageController.js";
import { convertImageFormat } from "../controllers/conversionController.js";
import { removeBackground } from "../controllers/bgremovecontroller.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import upload, { uploadToDisk } from "../middlewares/uploadMiddleware.js";
import { Storage } from "@google-cloud/storage";
import ImageModel from "../models/Imagemodel.js";

// Initialize Google Cloud Storage (skip in CI environment)
let storage = null;
let bucket = null;
if (process.env.NODE_ENV !== 'test' && process.env.GOOGLE_CLOUD_PROJECT_ID !== 'dummy-project') {
    storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
        }
    });
    bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
}
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const router=express.Router();


router.post("/compress",upload.single("image"), async(req,res)=>{

    try{

        const {quality}=req.body;

        if(!req.file){
            
            return res.status(400).json({message:"No file uploaded"});
        }
        // Use anonymous email for public compression
        const anonymousEmail = "anonymous@compressor.com";


        // if(!email){
        //     return res.status(400).json({message:"user email is required"});
        // }
        // Call the controller function
        const result = await compressAndUploadImage(req.file, quality || 50, anonymousEmail);



        if (!result || !result.fileUrl) {
            return res.status(500).json({ message: "File compression failed" });
        }

        res.status(200).json({
            message: "Image compressed successfully",
            fileUrl: result.fileUrl,
            originalSize: req.file.size,
            compressedSize: result.compressedSize,
            filename: result.filename,
            downloadUrl: `${BASE_URL}/api/image/download/${result.filename}`
        });

        

    }
    catch(error){
        console.error("Error processing Image",error);
        res.status(500).json({message:error.message || "Error processing image"});

    }
});

router.post("/convert", upload.single("image"),async(req,res)=>{
    try{
        const{format}=req.body;
        // No authentication required - converter is free
        if(!req.file){
            return res.status(400).json({message:"No file uploaded"});

        }
        // Convert image (no email required for free users)
        const result = await convertImageFormat(req.file,format);

        if(!result || !result.fileUrl){
            return res.status(500).json({message:"file conversion failed"});

        }

        res.status(200).json({
            message:"Image converted successfully",
            fileUrl: result.fileUrl,
            filename: result.filename,
            downloadUrl: `${BASE_URL}/api/image/download/${result.filename}`
        });

    }catch(error){
        console.error("Error converting image",error);
        res.status(500).json({message:error.message || "Error converting image"});
    }
});
router.post("/remove-bg", uploadToDisk.single("image"), async (req, res) => {
    try {
        // Use anonymous email for public background removal
        const anonymousEmail = "anonymous@bgremover.com";
        
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        // if (!email) return res.status(400).json({ message: "User email is required" });

        // removeBackground already sends the response, so we don't need to send another one
        await removeBackground(req, res);
    } catch (error) {
        console.error("Error removing background", error);
        // Only send response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || "An unexpected error occurred while processing the image." });
        }
    }
});

// PUBLIC ROUTE - Download compressed image
router.get("/download/:filename", async (req, res) => {
    try {
        const { filename } = req.params;

        // Get file from Google Cloud Storage
        const file = bucket.file(filename);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ message: "File not found" });
        }

        // Determine correct content type based on file extension
        const fileExtension = filename.toLowerCase().split('.').pop();
        let contentType = 'application/octet-stream'; // fallback

        switch (fileExtension) {
            case 'png':
                contentType = 'image/png';
                break;
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
            case 'avif':
                contentType = 'image/avif';
                break;
        }

        // Set headers for download with correct content type
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache');

        // Stream the file
        const stream = file.createReadStream();
        stream.pipe(res);

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ message: "Download failed" });
    }
});

// PUBLIC ROUTE - Preview image (generates fresh signed URL for Recent Activity)
router.get("/preview/:filename", async (req, res) => {
    try {
        const { filename } = req.params;

        // Get file from Google Cloud Storage
        const file = bucket.file(filename);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ message: "File not found" });
        }

        // Generate fresh signed URL for preview (valid for 1 hour)
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        // Set headers for image display
        res.setHeader('Content-Type', 'image/*');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        // Redirect to the fresh signed URL
        res.redirect(signedUrl);

    } catch (error) {
        console.error("Preview error:", error);
        res.status(500).json({ message: "Preview failed" });
    }
});

// PUBLIC ROUTE - Download converted image via backend
router.get("/download-converted", async (req, res) => {
    try {
        const { url,filename } = req.query; // Get the signed URL from query parameter

        if (!url) {
            return res.status(400).json({ message: "URL parameter required" });
        }

        // Fetch the file from Google Cloud Storage
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(404).json({ message: "File not found" });
        }


        // Get the file data
        const buffer = await response.arrayBuffer();

        // Extract format from URL or use filename
        const urlParts = url.split('/');
        const gcsFilename = urlParts[urlParts.length - 1].split('?')[0]; // Get filename before query params
        const extension = gcsFilename.split('.').pop(); // Get file extension

        // Set proper download headers with extension
        const downloadFilename = filename || `converted-image.${extension}`;
        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
        res.setHeader('Content-Type', `image/${extension}`);

        // Send the file
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ message: "Download failed" });
    }
});

// PUBLIC ROUTE - Download background removed image via backend
router.get("/download-bg-removed", async (req, res) => {
    try {
        const { url, filename } = req.query;

        if (!url) {
            return res.status(400).json({ message: "URL parameter required" });
        }

        // Fetch the file from Google Cloud Storage
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(404).json({ message: "File not found" });
        }

        // Get the file data
        const buffer = await response.arrayBuffer();

        // BG removed files are always PNG
        const downloadFilename = filename || "bg-removed-image.png";
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
        res.setHeader('Content-Type', 'image/png');

        // Send the file
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ message: "Download failed" });
    }
});



router.get("/history/:email",authenticate,getUserUploadHistory);

// Recent Activity route (for logged-in users)
router.get("/recent-activity", authenticate, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        // Get recent uploads (within 6 hours) for this user
        const recentUploads = await ImageModel.find({
            userEmail: userEmail,
            createdAt: { $gte: sixHoursAgo }
        }).sort({ createdAt: -1 });

        // Transform to match frontend format
        const uploads = recentUploads
            .filter(upload => upload.originalName && upload.processingType) // Filter out invalid entries
            .map(upload => {
                // Extract filename from the stored fileUrl for preview endpoint
                const urlParts = upload.fileUrl.split('/');
                const filename = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params

                return {
                    id: upload._id.toString(),
                    fileName: upload.originalName,
                    type: upload.processingType,
                    resultUrl: `${BASE_URL}/api/image/preview/${filename}`, // Use preview endpoint
                    downloadUrl: `${BASE_URL}/api/image/download/${filename}`, // Add download URL
                    uploadTime: upload.createdAt.toISOString(),
                    expiresAt: new Date(upload.createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString(),
                    fileSize: upload.fileSize || 0,
                    format: upload.format
                };
            });

        res.json({ uploads });
    } catch (error) {
        console.error("Recent activity error:", error);
        res.status(500).json({ message: "Failed to fetch recent activity", error: error.message });
    }
});

// Clean up invalid entries (for debugging)
router.post("/cleanup-invalid", authenticate, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find invalid entries (missing originalName or processingType)
        const invalidEntries = await ImageModel.find({
            userEmail,
            $or: [
                { originalName: { $exists: false } },
                { originalName: null },
                { originalName: "" },
                { processingType: { $exists: false } },
                { processingType: null },
                { processingType: "" }
            ]
        });



        // Delete invalid entries
        const deleteResult = await ImageModel.deleteMany({
            userEmail,
            $or: [
                { originalName: { $exists: false } },
                { originalName: null },
                { originalName: "" },
                { processingType: { $exists: false } },
                { processingType: null },
                { processingType: "" }
            ]
        });

        res.json({
            message: "Cleanup completed",
            deletedCount: deleteResult.deletedCount,
            invalidEntries: invalidEntries.map(entry => ({
                id: entry._id,
                originalName: entry.originalName,
                processingType: entry.processingType,
                createdAt: entry.createdAt
            }))
        });
    } catch (error) {
        console.error("Cleanup invalid error:", error);
        res.status(500).json({ message: "Failed to cleanup invalid entries", error: error.message });
    }
});

// Save activity to database (for logged-in users)
router.post("/save-activity", authenticate, async (req, res) => {
    try {
        const { originalName, fileUrl, processingType, fileSize, format } = req.body;
        const userEmail = req.user.email;

        // Validation: Don't save if essential data is missing
        if (!fileUrl || !originalName || !processingType) {

            return res.status(400).json({
                message: "Missing required fields",
                missing: { originalName: !originalName, fileUrl: !fileUrl, processingType: !processingType }
            });
        }

        // Check for duplicates (same fileUrl for same user)
        const existingImage = await ImageModel.findOne({
            userEmail,
            fileUrl,
            originalName
        });

        if (existingImage) {
            return res.json({ message: "Upload already exists", id: existingImage._id });
        }

        const newImage = new ImageModel({
            userEmail,
            fileUrl,
            originalName,
            processingType,
            fileSize,
            format,
            createdAt: new Date()
        });

        await newImage.save();
        res.json({ message: "Activity saved successfully", id: newImage._id });
    } catch (error) {
        console.error("Save activity error:", error);
        res.status(500).json({ message: "Failed to save activity", error: error.message });
    }
});



// PROTECTED ROUTE - Clear user's recent activity
router.delete("/clear-recent-activity", authenticate, async (req, res) => {
    try {
        const email = req.user.email;

        if (!email) {
            return res.status(400).json({ message: "User email is required" });
        }

        // Get all user's images before deletion (for file cleanup)
        const ImageModel = (await import('../models/Imagemodel.js')).default;
        const userImages = await ImageModel.find({ userEmail: email });

        // Delete files from Google Cloud Storage
        let deletedFiles = 0;
        let failedFiles = 0;

        for (const image of userImages) {
            try {
                // Extract filename from fileUrl
                const urlParts = image.fileUrl.split('/');
                const filename = urlParts[urlParts.length - 1].split('?')[0];

                // Delete from Google Cloud Storage
                const file = bucket.file(filename);
                const [exists] = await file.exists();

                if (exists) {
                    await file.delete();
                    deletedFiles++;
                }
            } catch (fileError) {
                failedFiles++;
                console.error(`❌ Failed to delete file:`, fileError);
            }
        }

        // Delete all records from database
        const deleteResult = await ImageModel.deleteMany({ userEmail: email });

        res.status(200).json({
            message: "Recent activity cleared successfully",
            deletedRecords: deleteResult.deletedCount,
            deletedFiles: deletedFiles,
            failedFiles: failedFiles
        });

    } catch (error) {
        console.error("Error clearing recent activity:", error);
        res.status(500).json({
            message: "Failed to clear recent activity",
            error: error.message
        });
    }
});

// ADMIN ROUTE - Manual cleanup (for testing)
router.post("/cleanup-now", async (req, res) => {
    try {
        const { runCleanupNow } = await import('../services/cleanupService.js');
        const result = await runCleanupNow();

        if (result.error) {
            return res.status(500).json({
                message: "Cleanup failed",
                error: result.error
            });
        }

        res.json({
            message: "Cleanup completed successfully",
            deletedCount: result.deletedCount,
            errorCount: result.errorCount
        });
    } catch (error) {
        console.error("Manual cleanup error:", error);
        res.status(500).json({ message: "Cleanup failed", error: error.message });
    }
});

// ADMIN ROUTE - Test cleanup (deletes files older than 1 minute - FOR TESTING ONLY)
router.post("/test-cleanup-1min", async (req, res) => {
    try {
        const ImageModel = (await import('../models/Imagemodel.js')).default;

        // Delete files older than 1 minute (for testing)
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

        const oldImages = await ImageModel.find({
            createdAt: { $lt: oneMinuteAgo }
        });

        let deletedCount = 0;
        let errorCount = 0;

        for (const image of oldImages) {
            try {
                const fileUrl = image.fileUrl;
                const urlParts = fileUrl.split('/');
                const fileName = urlParts[urlParts.length - 1].split('?')[0];

                // Delete from Google Cloud Storage
                const file = bucket.file(fileName);
                const [exists] = await file.exists();

                if (exists) {
                    await file.delete();
                }

                // Delete from database
                await ImageModel.findByIdAndDelete(image._id);

                deletedCount++;
            } catch (err) {
                errorCount++;
            }
        }

        res.json({
            message: "TEST cleanup completed (1 minute threshold)",
            deletedCount,
            errorCount
        });
    } catch (error) {
        console.error("Test cleanup error:", error);
        res.status(500).json({ message: "Test cleanup failed", error: error.message });
    }
});

// ADMIN ROUTE - Check cloud storage files (for monitoring)
router.get("/check-cloud-files", async (req, res) => {
    try {
        const [files] = await bucket.getFiles();

        const fileList = files.map(file => ({
            name: file.name,
            size: file.metadata.size,
            created: file.metadata.timeCreated,
            ageHours: Math.round((Date.now() - new Date(file.metadata.timeCreated)) / (1000 * 60 * 60))
        }));

        res.json({
            totalFiles: files.length,
            files: fileList.slice(0, 20) // Show only first 20 files
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADMIN ROUTE - Create test old file (for testing deletion)
router.post("/create-test-old-file", async (req, res) => {
    try {
        const ImageModel = (await import('../models/Imagemodel.js')).default;

        // Create a fake database entry with old timestamp (7 hours ago)
        const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);

        const testImage = new ImageModel({
            userEmail: "test@example.com",
            fileUrl: "https://storage.googleapis.com/compressed-images-bucket/test-old-file.jpg",
            format: "jpg",
            createdAt: sevenHoursAgo
        });

        await testImage.save();

        res.json({
            message: "Test old file entry created",
            fileId: testImage._id,
            createdAt: sevenHoursAgo,
            ageHours: 7
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




export default router;