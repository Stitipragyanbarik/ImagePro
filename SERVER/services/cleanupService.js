import { Storage } from '@google-cloud/storage';
import cron from 'node-cron';
import ImageModel from '../models/Imagemodel.js';

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
});
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Delete files older than 6 hours from both Google Cloud Storage and database
 */
export const deleteOldFiles = async () => {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // Step 1: Find old images in database
    const oldImages = await ImageModel.find({
      createdAt: { $lt: sixHoursAgo }
    });
    
    // Step 2: Delete each file from cloud storage and database
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const image of oldImages) {
      try {
        // Extract filename from URL
        const fileUrl = image.fileUrl;
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
        
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

    // Step 3: Also check for orphaned files in cloud storage
    try {
      const [files] = await bucket.getFiles();
      let orphanedCount = 0;

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const createdTime = new Date(metadata.timeCreated);

          if (createdTime < sixHoursAgo) {
            await file.delete();
            orphanedCount++;
          }
        } catch (err) {
          // Silent error handling
        }
      }
    } catch (err) {
      // Silent error handling
    }

    // Only log if there were actual deletions
    if (deletedCount > 0) {
      console.log(`🧹 Cleanup: Deleted ${deletedCount} files`);
    }
    return { deletedCount, errorCount };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Start the cleanup scheduler to run every hour
 */
export const startCleanupScheduler = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running scheduled cleanup...');
    await deleteOldFiles();
  });
  
  console.log('⏰ Cleanup scheduler started - runs every hour');
};

/**
 * Run cleanup immediately (for testing)
 */
export const runCleanupNow = async () => {
  console.log('🧹 Running immediate cleanup...');
  return await deleteOldFiles();
};
