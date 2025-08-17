// Data migration utility for localStorage → Cloud transfer

/**
 * Migrate localStorage data to cloud when user logs in
 */
export const migrateLocalDataToCloud = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found, skipping migration');
      return;
    }

    // Get localStorage data
    const localActivity = JSON.parse(localStorage.getItem('recentActivity') || '{"uploads":[]}');
    
    if (localActivity.uploads.length === 0) {
      console.log('No local data to migrate');
      return;
    }

    console.log(`🔄 Migrating ${localActivity.uploads.length} uploads to cloud...`);
    
    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each upload to cloud
    for (const upload of localActivity.uploads) {
      try {
        // Check if upload is still valid (not expired)
        const expiresAt = new Date(upload.expiresAt);
        const now = new Date();
        
        if (now > expiresAt) {
          console.log(`⏰ Skipping expired upload: ${upload.fileName}`);
          continue;
        }

        // Save to cloud database
        const response = await fetch('http://localhost:5000/api/image/save-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            originalName: upload.fileName,
            fileUrl: upload.resultUrl,
            processingType: upload.type,
            fileSize: upload.fileSize,
            format: getFormatFromType(upload.type),
            // Preserve original timestamps
            createdAt: upload.uploadTime
          })
        });

        if (response.ok) {
          migratedCount++;
          console.log(`✅ Migrated: ${upload.fileName}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to migrate: ${upload.fileName}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Migration error for ${upload.fileName}:`, error);
      }
    }

    console.log(`🎉 Migration completed: ${migratedCount} successful, ${errorCount} errors`);

    // Always clear localStorage after migration attempt (successful or not)
    // This ensures clean state for logged-in users
    localStorage.removeItem('recentActivity');
    console.log('🧹 Cleared localStorage after migration - user now uses cloud storage');

    // Show success message to user
    if (migratedCount > 0) {
      console.log(`✅ Successfully migrated ${migratedCount} uploads to your account!`);
    }

    return { migratedCount, errorCount };
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    return { migratedCount: 0, errorCount: 1 };
  }
};

/**
 * Get file format from processing type
 */
const getFormatFromType = (type) => {
  switch (type) {
    case 'compression': return 'jpg';
    case 'conversion': return 'png'; // Default, actual format may vary
    case 'bg-removal': return 'png';
    default: return 'jpg';
  }
};

/**
 * Setup automatic localStorage cleanup (every 6 hours)
 */
export const setupLocalStorageCleanup = () => {
  // Clean up immediately on setup
  cleanupExpiredLocalStorage();
  
  // Set up interval for every 6 hours
  const cleanupInterval = setInterval(() => {
    cleanupExpiredLocalStorage();
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

  console.log('⏰ localStorage cleanup scheduled every 6 hours');
  
  // Return cleanup function
  return () => {
    clearInterval(cleanupInterval);
    console.log('🛑 localStorage cleanup stopped');
  };
};

/**
 * Clean up expired items from localStorage
 */
export const cleanupExpiredLocalStorage = () => {
  try {
    const activity = JSON.parse(localStorage.getItem('recentActivity') || '{"uploads":[]}');
    const now = new Date();
    
    const initialCount = activity.uploads.length;
    
    // Filter out expired uploads
    const activeUploads = activity.uploads.filter(upload => {
      const expiresAt = new Date(upload.expiresAt);
      return now <= expiresAt;
    });
    
    const removedCount = initialCount - activeUploads.length;
    
    if (removedCount > 0) {
      // Update localStorage with active uploads only
      localStorage.setItem('recentActivity', JSON.stringify({ uploads: activeUploads }));
      console.log(`🧹 Cleaned up ${removedCount} expired items from localStorage`);
    }
    
    return removedCount;
  } catch (error) {
    console.error('❌ localStorage cleanup error:', error);
    return 0;
  }
};

/**
 * Smart data loading: localStorage for anonymous, cloud for logged-in users
 */
export const loadRecentActivity = async () => {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    // Logged-in user: Load from cloud
    return await loadFromCloud();
  } else {
    // Anonymous user: Load from localStorage
    return loadFromLocalStorage();
  }
};

/**
 * Load data from cloud (for logged-in users)
 */
const loadFromCloud = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:5000/api/image/recent-activity', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.uploads || [];
    } else {
      console.error('Failed to load from cloud, falling back to localStorage');
      return loadFromLocalStorage();
    }
  } catch (error) {
    console.error('Cloud loading error, falling back to localStorage:', error);
    return loadFromLocalStorage();
  }
};

/**
 * Load data from localStorage (for anonymous users)
 */
const loadFromLocalStorage = () => {
  try {
    const activity = JSON.parse(localStorage.getItem('recentActivity') || '{"uploads":[]}');
    return activity.uploads || [];
  } catch (error) {
    console.error('localStorage loading error:', error);
    return [];
  }
};

/**
 * Smart data saving: localStorage for anonymous, cloud for logged-in users
 */
export const saveRecentActivity = async (uploadData) => {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    // Logged-in user: Save to cloud
    await saveToCloud(uploadData);
  } else {
    // Anonymous user: Save to localStorage
    saveToLocalStorage(uploadData);
  }
};

/**
 * Save to cloud (for logged-in users)
 */
const saveToCloud = async (uploadData) => {
  try {
    const token = localStorage.getItem('authToken');

    // Handle inconsistent field names from different features
    const fileName = uploadData.fileName || uploadData.filename;
    const resultUrl = uploadData.resultUrl || uploadData.processedUrl;
    const fileSize = uploadData.fileSize || uploadData.originalSize;

    console.log('💾 Saving to cloud:', { fileName, resultUrl, type: uploadData.type, fileSize });

    const response = await fetch('http://localhost:5000/api/image/save-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        originalName: fileName,
        fileUrl: resultUrl,
        processingType: uploadData.type,
        fileSize: fileSize,
        format: uploadData.format || uploadData.newFormat || 'jpg'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save to cloud');
    }
    
    console.log(`☁️ Saved to cloud: ${uploadData.fileName}`);
  } catch (error) {
    console.error('Cloud save error, falling back to localStorage:', error);
    // Fallback to localStorage if cloud save fails
    saveToLocalStorage(uploadData);
  }
};

/**
 * Save to localStorage (for anonymous users or fallback)
 */
const saveToLocalStorage = (uploadData) => {
  try {
    const activity = JSON.parse(localStorage.getItem('recentActivity') || '{"uploads":[]}');
    
    const uploadRecord = {
      id: Date.now(),
      fileName: uploadData.fileName,
      type: uploadData.type,
      resultUrl: uploadData.resultUrl,
      uploadTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
      fileSize: uploadData.fileSize,
      originalSize: uploadData.originalSize,
      format: uploadData.format
    };
    
    activity.uploads.unshift(uploadRecord);
    activity.uploads = activity.uploads.slice(0, 20); // Keep only last 20
    
    localStorage.setItem('recentActivity', JSON.stringify(activity));
    console.log(`💾 Saved to localStorage: ${uploadData.fileName}`);
  } catch (error) {
    console.error('localStorage save error:', error);
  }
};
