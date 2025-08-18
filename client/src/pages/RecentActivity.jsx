import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { loadRecentActivity } from '../utils/dataMigration';

function RecentActivity() {
  const [recentUploads, setRecentUploads] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);

    if (token) {
      // Logged-in user: Load from cloud
      loadData();
    } else {
      // Anonymous user: Load from localStorage for preview
      loadLocalStorageData();
    }
  }, []);

  const loadLocalStorageData = () => {
    try {
      const activity = JSON.parse(localStorage.getItem('recentActivity') || '{"uploads":[]}');
      const now = new Date();

      // Filter and update expired status
      const updatedUploads = activity.uploads.map(upload => {
        const expiresAt = new Date(upload.expiresAt);
        const isExpired = now > expiresAt;
        const timeLeft = isExpired ? 0 : Math.max(0, expiresAt - now);

        return {
          ...upload,
          isExpired,
          timeLeft,
          timeLeftFormatted: formatTimeLeft(timeLeft)
        };
      });

      // Sort by upload time (newest first)
      updatedUploads.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      setRecentUploads(updatedUploads);
    } catch (error) {
      console.error('Failed to load localStorage data:', error);
      setRecentUploads([]);
    }
  };

  const loadData = async () => {
    try {
      // For logged-in users, load from cloud
      const token = localStorage.getItem('authToken');
      let uploads = [];

      if (token) {
        // Load from cloud database
        const response = await fetch('http://localhost:5000/api/image/recent-activity', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          uploads = data.uploads || [];
        } else {
          console.error('Failed to fetch from cloud, status:', response.status);
          uploads = [];
        }
      } else {
        // This shouldn't happen since we check login status, but fallback to localStorage
        uploads = await loadRecentActivity();
      }

      const now = new Date();

      // Filter and update expired status
      const updatedUploads = uploads.map(upload => {
        const expiresAt = new Date(upload.expiresAt);
        const isExpired = now > expiresAt;
        const timeLeft = isExpired ? 0 : Math.max(0, expiresAt - now);

        return {
          ...upload,
          isExpired,
          timeLeft,
          timeLeftFormatted: formatTimeLeft(timeLeft)
        };
      });

      // Sort by upload time (newest first)
      updatedUploads.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      setRecentUploads(updatedUploads);

      // Set first available image as selected if none selected
      if (!selectedImage && updatedUploads.length > 0) {
        const firstAvailable = updatedUploads.find(upload => !upload.isExpired);
        if (firstAvailable) {
          setSelectedImage(firstAvailable);
        }
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      setRecentUploads([]);
    }
  };

  const formatTimeLeft = (milliseconds) => {
    if (milliseconds <= 0) return 'Expired';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'compression': return '🗜️';
      case 'conversion': return '🔄';
      case 'bg-removal': return '✂️';
      default: return '📁';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'compression': return 'Compressed';
      case 'conversion': return 'Converted';
      case 'bg-removal': return 'Background Removed';
      default: return 'Processed';
    }
  };

  const handleDownload = async (upload) => {
    if (upload.isExpired) {
      alert('This image has expired and is no longer available for download.');
      return;
    }

    setDownloadingId(upload.id);

    try {
      // Method 1: Try backend download route first (better headers)
      const filename = upload.resultUrl.split('/').pop().split('?')[0];
      const backendDownloadUrl = `http://localhost:5000/api/image/download/${filename}`;

      try {
        const response = await fetch(backendDownloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = upload.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(url);
          return; // Success, exit early
        }
      } catch (backendError) {
        console.log('Backend download failed, trying direct method:', backendError);
      }

      // Method 2: Fallback to direct download
      const response = await fetch(upload.resultUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = upload.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. The image may have expired or is no longer available.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Clear all recent activity
  const clearRecentActivity = async () => {
    setIsClearing(true);
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        // Clear localStorage for anonymous users
        localStorage.removeItem('recentUploads');
        setRecentUploads([]);
        setSelectedImage(null);
        console.log('✅ Cleared localStorage recent activity');
      } else {
        // Clear cloud data for logged-in users
        const response = await fetch('http://localhost:5000/api/image/clear-recent-activity', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to clear activity: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Cleared cloud recent activity:', result);

        // Clear local state
        setRecentUploads([]);
        setSelectedImage(null);

        // Also clear localStorage as backup
        localStorage.removeItem('recentUploads');
      }

      setShowClearConfirm(false);
    } catch (error) {
      console.error('❌ Failed to clear recent activity:', error);
      alert('Failed to clear recent activity. Please try again.');
    }
    setIsClearing(false);
  };

  const handleViewImage = (upload) => {
    if (upload.isExpired) {
      alert('This image has expired and is no longer available for viewing.');
      return;
    }
    setSelectedImage(upload);
  };

  const clearExpiredItems = () => {
    const activity = JSON.parse(localStorage.getItem('recentActivity') || '{"uploads":[]}');
    const now = new Date();
    
    const activeUploads = activity.uploads.filter(upload => {
      const expiresAt = new Date(upload.expiresAt);
      return now <= expiresAt;
    });
    
    const updatedActivity = { uploads: activeUploads };
    localStorage.setItem('recentActivity', JSON.stringify(updatedActivity));
    loadData();
    
    if (selectedImage && selectedImage.isExpired) {
      const firstAvailable = activeUploads.find(upload => !upload.isExpired);
      setSelectedImage(firstAvailable || null);
    }
  };

  // Auto-refresh every minute to update time left
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (token) {
        loadData(); // Refresh cloud data
      } else {
        loadLocalStorageData(); // Refresh localStorage data
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for login state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const wasLoggedIn = isLoggedIn;
      const nowLoggedIn = !!token;

      if (!wasLoggedIn && nowLoggedIn) {
        // User just logged in, refresh the page data
        setIsLoggedIn(true);
        setTimeout(() => {
          loadData(); // Load cloud data after migration
        }, 2000); // Wait for migration to complete
      } else if (wasLoggedIn && !nowLoggedIn) {
        // User logged out
        setIsLoggedIn(false);
        loadLocalStorageData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isLoggedIn]);



  // If user is not logged in, show login requirement with localStorage preview
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-12">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🔒</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
              <p className="text-gray-600 mb-6">
                Access to Recent Activity requires an account to ensure your upload history is secure and accessible across devices.
              </p>

              {/* Show preview of localStorage data if exists */}
              {recentUploads.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-green-800 font-semibold mb-2">🎉 Great News!</h3>
                  <p className="text-green-700 text-sm mb-3">
                    You have <strong>{recentUploads.length} recent upload{recentUploads.length > 1 ? 's' : ''}</strong> from this browser session.
                    After logging in, these will be automatically saved to your account.
                  </p>
                  <div className="text-left bg-white rounded p-3 max-h-32 overflow-y-auto">
                    {recentUploads.slice(0, 3).map((upload, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600 mb-1">
                        <span className="mr-2">{getTypeIcon(upload.type)}</span>
                        <span className="truncate">{upload.fileName}</span>
                      </div>
                    ))}
                    {recentUploads.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">...and {recentUploads.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/login"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    � Login to Access History
                  </Link>
                  <Link
                    to="/register"
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    📝 Create Free Account
                  </Link>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm mb-4">Or continue using our free tools:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/compressor" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                      🗜️ Compressor
                    </Link>
                    <Link to="/converter" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                      🔄 Converter
                    </Link>
                    <Link to="/bg-remover" className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                      ✂️ BG Remover
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">📱 Recent Activity</h1>
            {recentUploads.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isClearing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Recent Activity'}
              </button>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-700 text-sm">
              Your upload history from this account. Images are automatically deleted after 6 hours for privacy protection.
            </p>
            {recentUploads.length > 0 && (
              <p className="text-blue-600 text-xs mt-2">
                💡 This includes any uploads migrated from your browser session when you logged in.
              </p>
            )}
          </div>
        </div>

        {recentUploads.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl text-gray-400">📁</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Recent Activity</h3>
            <p className="text-gray-500 mb-6">
              Start by uploading and processing some images using our tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/compressor" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                🗜️ Compress Images
              </Link>
              <Link to="/converter" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                � Convert Formats
              </Link>
              <Link to="/bg-remover" className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                ✂️ Remove Background
              </Link>
            </div>
          </div>
        ) : (
          // Main Content
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Sidebar - Upload List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Uploads</h2>
                  <button
                    onClick={clearExpiredItems}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    🗑️ Clear Expired
                  </button>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedImage?.id === upload.id
                          ? 'border-blue-500 bg-blue-50'
                          : upload.isExpired
                          ? 'border-red-200 bg-red-50 opacity-60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => !upload.isExpired && handleViewImage(upload)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(upload.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900 text-sm truncate" title={upload.fileName}>
                              {upload.fileName}
                            </p>
                            <p className="text-xs text-gray-500">{getTypeLabel(upload.type)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-3">
                        <p>Size: {formatFileSize(upload.fileSize)}</p>
                        <p className={upload.isExpired ? 'text-red-600' : 'text-green-600'}>
                          {upload.isExpired ? '🗑️ Expired' : `⏰ ${upload.timeLeftFormatted} left`}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(upload);
                          }}
                          disabled={upload.isExpired || downloadingId === upload.id}
                          className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                            upload.isExpired || downloadingId === upload.id
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {downloadingId === upload.id ? '⏳ Downloading...' : '💾 Download'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewImage(upload);
                          }}
                          disabled={upload.isExpired}
                          className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                            upload.isExpired
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          👁️ View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Image Preview */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-lg p-8">
                {selectedImage ? (
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {getTypeIcon(selectedImage.type)} {selectedImage.fileName}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{getTypeLabel(selectedImage.type)}</span>
                          <span>•</span>
                          <span>{formatFileSize(selectedImage.fileSize)}</span>
                          <span>•</span>
                          <span className={selectedImage.isExpired ? 'text-red-600' : 'text-green-600'}>
                            {selectedImage.isExpired ? '🗑️ Expired' : `⏰ ${selectedImage.timeLeftFormatted} left`}
                          </span>
                        </div>
                      </div>
                      
                      {!selectedImage.isExpired && (
                        <button
                          onClick={() => handleDownload(selectedImage)}
                          disabled={downloadingId === selectedImage.id}
                          className={`px-6 py-2 rounded-lg transition-colors ${
                            downloadingId === selectedImage.id
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {downloadingId === selectedImage.id ? '⏳ Downloading...' : '💾 Download'}
                        </button>
                      )}
                    </div>

                    {/* Clean Image Display */}
                    <div className="bg-gray-50 rounded-xl overflow-hidden shadow-inner">
                      {selectedImage.isExpired ? (
                        <div className="py-20 text-center">
                          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <span className="text-3xl text-red-500">🗑️</span>
                          </div>
                          <h3 className="text-xl font-semibold text-red-600 mb-3">Image Expired</h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            This image has been automatically deleted after 6 hours for privacy protection.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={selectedImage.resultUrl}
                            alt={selectedImage.fileName}
                            className="w-full h-auto max-h-[400px] object-contain bg-white rounded-lg"
                            onError={(e) => {
                              console.error('Image preview failed for:', selectedImage.fileName, 'URL:', selectedImage.resultUrl);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('Image preview loaded successfully for:', selectedImage.fileName);
                            }}
                          />
                          <div style={{ display: 'none' }} className="py-20 text-center items-center justify-center flex-col">
                            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                              <span className="text-3xl text-yellow-500">⚠️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-yellow-600 mb-3">Preview Not Available</h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                              The image preview couldn't load, but you can still download the file.
                            </p>
                          </div>

                          {/* Image Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <div className="text-white text-sm">
                              <p className="font-medium">{selectedImage.fileName}</p>
                              <p className="opacity-90">
                                {selectedImage.type === 'compression' && '🗜️ Compressed'}
                                {selectedImage.type === 'conversion' && '🔄 Converted'}
                                {selectedImage.type === 'bg-removal' && '✂️ Background Removed'}
                                {selectedImage.fileSize && ` • ${formatFileSize(selectedImage.fileSize)}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl text-gray-400">👁️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Select an Image</h3>
                    <p className="text-gray-500">
                      Choose an upload from the sidebar to view and download.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Confirmation Popup - No Dark Background */}
      {showClearConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-md mx-4 pointer-events-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🗑️</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Recent Activity?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete all your recent uploads and processing history.
                This action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearRecentActivity}
                  disabled={isClearing}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isClearing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Recent Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
