import React, { useState, useEffect } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import DeleteConfirmPopup from '../components/DeleteConfirmPopup';
import { saveRecentActivity } from '../utils/dataMigration';
import { validateFiles, handleNetworkError, handleServerError, isFileCorrupted } from '../utils/fileValidation';




function Compressor() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Debounced live preview generation
  useEffect(() => {
    if (files.length > 0 && selectedImageIndex < files.length) {
      const currentFile = files[selectedImageIndex];
      if (currentFile && currentFile.preview) {
        // Debounce the live preview generation to avoid too many server requests
        const timeoutId = setTimeout(() => {
          generateLivePreview(quality, currentFile);
        }, 500); // Wait 500ms after user stops moving slider

        return () => clearTimeout(timeoutId);
      }
    }
  }, [files, selectedImageIndex, quality]);



  // Handle multiple file selection with comprehensive validation
  const processFiles = async (selectedFiles) => {
    setError(''); // Clear previous errors

    // Check if adding to existing files would exceed limit
    const currentCount = files.length;
    const newCount = selectedFiles.length;
    const totalCount = currentCount + newCount;

    if (totalCount > 20) {
      setError(`Cannot add ${newCount} files. You already have ${currentCount} files. Maximum 20 files allowed total.`);
      return;
    }

    // Validate all new files
    const validation = validateFiles(selectedFiles, 'COMPRESSOR');

    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    // Show validation summary if some files were rejected
    if (validation.invalidCount > 0) {
      setError(`${validation.invalidCount} files rejected. Adding ${validation.validCount} valid files.\n${validation.errors.join('\n')}`);
    }

    // Process valid files
    const processPromises = validation.validFiles.map(async (file, index) => {
      try {
        // Check if file is corrupted
        const isCorrupted = await isFileCorrupted(file);
        if (isCorrupted) {
          setError(prev => prev + `\n${file.name}: File appears to be corrupted or invalid.`);
          return null;
        }

        // Create file data object
        const fileData = {
          id: Date.now() + Math.random() + index,
          file: file,
          preview: URL.createObjectURL(file),
          livePreview: null,
          result: null,
          isProcessing: false,
          isSelected: true // Auto-select new images
        };

        // Generate initial live preview at current quality (staggered)
        setTimeout(() => {
          generateLivePreview(quality, fileData);
        }, 100 * (index + 1));

        return fileData;
      } catch (error) {
        setError(prev => prev + `\n${file.name}: Error processing file - ${error.message}`);
        return null;
      }
    });

    // Wait for all files to be processed
    const processedFiles = await Promise.all(processPromises);
    const validProcessedFiles = processedFiles.filter(file => file !== null);

    if (validProcessedFiles.length > 0) {
      setFiles(prev => [...prev, ...validProcessedFiles]);
      console.log(`✅ Successfully added ${validProcessedFiles.length} files to Compressor`);
    } else {
      setError('No valid files could be added. Please check your files and try again.');
    }
  };

  // Add more files
  const addMoreFiles = (selectedFiles) => {
    processFiles(selectedFiles);
  };

  // Toggle image selection
  const toggleImageSelection = (fileId) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, isSelected: !f.isSelected } : f
    ));
  };

  // Select all images
  const selectAllImages = () => {
    setFiles(prev => prev.map(f => ({ ...f, isSelected: true })));
  };

  // Deselect all images
  const deselectAllImages = () => {
    setFiles(prev => prev.map(f => ({ ...f, isSelected: false })));
  };

  // Remove file with confirmation
  const removeFile = (fileId) => {
    setPendingDeleteId(fileId);
    setShowDeletePopup(true);
  };

  // Simple delete without confirmation (for cross button)
  const simpleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedImageIndex >= files.length - 1) {
      setSelectedImageIndex(Math.max(0, files.length - 2));
    }
  };

  // Delete selected images with confirmation
  const deleteSelectedImages = () => {
    const selectedFiles = files.filter(f => f.isSelected);

    if (selectedFiles.length === 0) {
      setError('Please select at least one image to delete');
      return;
    }

    // Use the existing popup but for multiple files
    setPendingDeleteId('selected'); // Special ID for selected files
    setShowDeletePopup(true);
  };

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    processFiles(selectedFiles);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    processFiles(droppedFiles);
  };

  // Retry mechanism for network issues
  const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`Retry ${i + 1}/${maxRetries} after error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Compress selected images with improved error handling
  const compressSelectedImages = async () => {
    const selectedFiles = files.filter(f => f.isSelected && !f.result);

    if (selectedFiles.length === 0) {
      setError('Please select images to compress');
      return;
    }

    setIsProcessing(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileData = selectedFiles[i];

      // Update processing state
      setFiles(prev => prev.map(f =>
        f.id === fileData.id ? { ...f, isProcessing: true } : f
      ));

      try {
        const data = await retryOperation(async () => {
          const formData = new FormData();
          formData.append('image', fileData.file);
          formData.append('quality', quality);

          const response = await fetch(getApiUrl(API_ENDPOINTS.COMPRESS), {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorMessage = handleServerError(response);
            throw new Error(`Compression failed: ${errorMessage}`);
          }

          const data = await response.json();

          // Validate response data
          if (!data.fileUrl || !data.downloadUrl) {
            throw new Error('Invalid response from server - missing file URLs');
          }

          return data;
        });

        const resultData = {
          url: data.fileUrl,
          downloadUrl: data.downloadUrl,
          originalSize: data.originalSize || fileData.file.size,
          compressedSize: data.compressedSize || fileData.file.size
        };

        // Update file with result
        setFiles(prev => prev.map(f =>
          f.id === fileData.id
            ? { ...f, result: resultData, isProcessing: false }
            : f
        ));

        // Save to recent activity
        await saveRecentActivity({
          type: 'compression',
          fileName: fileData.file.name,
          fileSize: fileData.file.size,
          resultUrl: data.fileUrl,
          downloadUrl: data.downloadUrl,
          originalSize: data.originalSize || fileData.file.size,
          compressedSize: data.compressedSize || fileData.file.size
        });

      } catch (error) {
        console.error('Compression error:', error);

        // Determine error type and provide appropriate message
        let errorMessage = `Failed to compress ${fileData.file.name}: `;

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage += handleNetworkError(error);
        } else if (error.message.includes('Server error')) {
          errorMessage += error.message;
        } else if (error.message.includes('Invalid response')) {
          errorMessage += 'Server returned invalid data. Please try again.';
        } else if (error.message.includes('Compression failed')) {
          errorMessage += 'Unable to compress image. Please check the file and try again.';
        } else {
          errorMessage += error.message || 'Unknown error occurred. Please try again.';
        }

        setError(prev => prev ? prev + '\n' + errorMessage : errorMessage);

        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, isProcessing: false } : f
        ));
      }
    }

    setIsProcessing(false);
  };

  // Smart Download Function - Single file or ZIP based on count
  const handleSmartDownload = async () => {
    const completedFiles = files.filter(f => f.result);
    console.log(`Smart Download: ${completedFiles.length} completed files`);

    if (completedFiles.length === 1) {
      // Single file - Direct download with proper format
      console.log('Downloading single file directly');
      const fileData = completedFiles[0];

      try {
        const a = document.createElement('a');
        a.href = fileData.result.downloadUrl;
        a.download = `compressed_${fileData.file.name}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('Single file download triggered successfully');
      } catch (error) {
        console.error('Single file download error:', error);
        setError('Failed to download image');
      }
    } else if (completedFiles.length > 1) {
      // Multiple files - Download as ZIP
      console.log('Downloading multiple files as ZIP');
      await downloadAllAsZip();
    }
  };

  // Download all as ZIP - Direct download
  const downloadAllAsZip = async () => {
    setIsDownloadingZip(true);
    console.log('Starting ZIP download for', files.filter(f => f.result).length, 'files');

    try {
      // Create ZIP file with all compressed images
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add all compressed images to ZIP
      const completedFiles = files.filter(f => f.result);

      await Promise.all(
        completedFiles.map(async (fileData, index) => {
          try {
            console.log(`Fetching file ${index + 1}:`, fileData.result.downloadUrl);

            const response = await fetch(fileData.result.downloadUrl, {
              mode: 'cors',
              credentials: 'omit'
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            console.log(`File ${index + 1} blob size:`, blob.size);

            if (blob.size === 0) {
              throw new Error('Empty file received');
            }

            const fileName = `compressed_${fileData.file.name}`;
            zip.file(fileName, blob);

            console.log(`Added ${fileName} to ZIP`);
          } catch (error) {
            console.error(`Error processing ${fileData.file.name}:`, error);
            // Add error file to ZIP for debugging
            zip.file(`ERROR_${fileData.file.name}.txt`, `Failed to download: ${error.message}`);
          }
        })
      );

      console.log('All files processed, generating ZIP...');

      // Generate and download ZIP immediately
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('ZIP generated, size:', zipBlob.size);

      if (zipBlob.size === 0) {
        throw new Error('Generated ZIP is empty');
      }

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_images_${Date.now()}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('ZIP download completed');

    } catch (error) {
      console.error('ZIP download error:', error);
      setError(`Failed to download ZIP file: ${error.message}`);
    }

    setIsDownloadingZip(false);
  };



  // Generate live preview for specific file using server compression
  const generateLivePreview = async (newQuality, fileData) => {
    if (!fileData || !fileData.file) return;

    try {
      console.log(`Generating live preview for ${fileData.file.name} at ${newQuality}% quality`);

      // Create FormData for server compression
      const formData = new FormData();
      formData.append('image', fileData.file);
      formData.append('quality', newQuality.toString());

      // Send to server for compression (same as actual compression)
      const response = await fetch('http://localhost:5000/api/image/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Preview compression failed: ${response.status}`);
      }

      const data = await response.json();

      // Update file with live preview URL (use the actual compressed image)
      setFiles(prev => prev.map(f =>
        f.id === fileData.id ? {
          ...f,
          livePreview: data.fileUrl,
          livePreviewSize: data.compressedSize
        } : f
      ));

      console.log(`Live preview generated successfully for ${fileData.file.name}`);
    } catch (error) {
      console.error('Live preview error:', error);
      // Fallback to client-side preview if server fails
      generateClientSidePreview(newQuality, fileData);
    }
  };

  // Fallback client-side preview
  const generateClientSidePreview = (newQuality, fileData) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const previewQuality = Math.max(newQuality / 100, 0.1);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setFiles(prev => prev.map(f =>
              f.id === fileData.id ? { ...f, livePreview: url } : f
            ));
          }
        }, 'image/jpeg', previewQuality);
      };

      img.src = fileData.preview;
    } catch (error) {
      console.error('Client-side preview error:', error);
    }
  };





    const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
        {/* Header - Only show when no files uploaded */}
        {files.length === 0 && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Image Compressor</h1>
            <p className="text-lg text-gray-600">Reduce file size without losing quality</p>
            <p className="text-sm text-blue-600 mt-2">✨ No registration required - Compress images for free!</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </>
      )}
      
      {/* UPLOAD SECTION - Only show when no files are selected */}
      {files.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>

            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Choose Image Files
              </label>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>or drag and drop multiple images here</strong></p>
              <p>Supported formats: JPEG, PNG, WebP</p>
              <p>Maximum size: 10MB per file</p>
              <p className="text-blue-600 font-medium">✨ Select multiple files for batch compression!</p>
            </div>
          </div>
        </div>
      )}


      {/* MULTIPLE IMAGES SECTION - Show when files are uploaded */}
      {files.length > 0 && (
        <div className="min-h-screen flex flex-col">
          {/* Compact Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">📸 Image Compressor</h1>
              {files.length > 0 && files.every(f => f.result) && (
                <button
                  onClick={() => handleSmartDownload()}
                  disabled={isDownloadingZip}
                  className={`px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    isDownloadingZip
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isDownloadingZip
                    ? '⬇️ Downloading...'
                    : files.filter(f => f.result).length === 1
                      ? '⬇️ Download'
                      : '⬇️ Download All'
                  }
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT SIDEBAR - Images */}
            <div className="w-full lg:w-80 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-96 lg:max-h-none">
              {/* Sidebar Header */}
              <div className="p-2 sm:p-4 border-b border-gray-200">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center">
                  📸 Images ({files.length})
                </h3>
              </div>

              {/* Add More Button */}
              <div className="p-2 sm:p-4">
                <div className="w-full h-12 sm:h-16 border-2 border-dashed border-green-400 rounded-lg cursor-pointer transition-all hover:border-green-500 hover:bg-green-50 flex items-center justify-center">
                  <input
                    type="file"
                    id="add-more-files"
                    accept="image/*"
                    multiple
                    onChange={(e) => addMoreFiles(e.target.files)}
                    className="hidden"
                  />
                  <label
                    htmlFor="add-more-files"
                    className="cursor-pointer flex items-center space-x-1 sm:space-x-2 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <span className="text-lg sm:text-xl">➕</span>
                    <span className="font-medium text-sm sm:text-base">Add More</span>
                  </label>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="p-2 sm:p-4 border-b border-gray-200">
                <div className="space-y-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={selectAllImages}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllImages}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    onClick={deleteSelectedImages}
                    disabled={files.filter(f => f.isSelected).length === 0}
                    className={`w-full px-3 py-2 text-xs rounded transition-colors ${
                      files.filter(f => f.isSelected).length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    🗑️ Delete Selected ({files.filter(f => f.isSelected).length})
                  </button>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs text-gray-600">
                    {files.filter(f => f.isSelected).length} of {files.length} selected
                  </span>
                </div>
              </div>

              {/* Images List - Scrollable */}
              <div
                className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 custom-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9ca3af #f3f4f6',
                  maxHeight: 'calc(100vh - 400px)',
                  minHeight: '200px'
                }}
              >
                {files.map((fileData, index) => (
                  <div
                    key={fileData.id}
                    className={`relative group border-2 rounded-lg transition-all p-2 ${
                      fileData.isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                        : selectedImageIndex === index
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                    } ${fileData.result ? 'cursor-pointer' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={fileData.isSelected}
                        onChange={() => toggleImageSelection(fileData.id)}
                        className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors cursor-pointer"
                      />

                      {/* Small Image Preview */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={fileData.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileData.file.size)}
                        </p>
                      </div>

                      {/* Status Icons */}
                      <div className="flex items-center space-x-1">
                        {fileData.isProcessing && (
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        )}
                        {fileData.result && (
                          <div className="w-3 h-3 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}

                        {/* Remove Button - Simple delete without popup */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            simpleRemoveFile(fileData.id);
                          }}
                          className="w-4 h-4 sm:w-3 sm:h-3 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs"
                          title="Delete this image"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download All Button - Bottom of Sidebar */}
              {files.length > 0 && (
                <div className="p-2 sm:p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      console.log('Download button clicked!');
                      console.log('Files:', files.length);
                      console.log('Files with results:', files.filter(f => f.result).length);
                      handleSmartDownload();
                    }}
                    disabled={isDownloadingZip || files.filter(f => f.result).length === 0}
                    className={`w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg font-bold transition-colors text-sm sm:text-base border-2 ${
                      isDownloadingZip || files.filter(f => f.result).length === 0
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed border-gray-400'
                        : 'bg-green-500 text-white hover:bg-green-600 border-green-600 shadow-lg'
                    }`}
                  >
                    {isDownloadingZip
                      ? '📦 Downloading...'
                      : files.filter(f => f.result).length === 0
                        ? '⚠️ Compress Images First'
                        : files.filter(f => f.result).length === 1
                          ? '📥 Download Image'
                          : `📦 Download All (${files.filter(f => f.result).length})`
                    }
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT MAIN CONTENT - Settings and Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Settings for Selected Image */}
              {files.length > 0 && selectedImageIndex < files.length && (
                <div className="flex-1 flex flex-col p-3 sm:p-6 space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">⚙️ Compression Settings</h3>

                  {/* Quality Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Quality Level</label>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="hidden sm:inline">10% (Maximum Compression)</span>
                      <span className="sm:hidden">10%</span>
                      <span className="hidden sm:inline">50% (Balanced)</span>
                      <span className="sm:hidden">50%</span>
                      <span className="hidden sm:inline">100% (Original Quality)</span>
                      <span className="sm:hidden">100%</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">
                        {quality <= 30 ? '🔥 High Compression (Smaller file, lower quality)' :
                         quality <= 70 ? '⚖️ Balanced (Good quality, moderate size)' :
                         '✨ High Quality (Larger file, best quality)'}
                      </span>
                    </div>
                  </div>

                  {/* Live Preview for Selected Image - Full Width, Responsive Height */}
                  {files[selectedImageIndex] && files[selectedImageIndex].livePreview && (
                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900">🔍 Live Preview</h4>
                      <div className="w-full">
                        <BeforeAfterSlider
                          beforeImage={files[selectedImageIndex].preview}
                          afterImage={files[selectedImageIndex].livePreview}
                          beforeLabel="Original"
                          afterLabel={`${quality}% Quality`}
                          className="w-full h-96 md:h-[500px]"
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>Drag to compare • {quality}% quality</p>
                        {files[selectedImageIndex].livePreviewSize && (
                          <p className="text-blue-600 font-medium">
                            Preview Size: {formatFileSize(files[selectedImageIndex].livePreviewSize)}
                            {files[selectedImageIndex].file.size && (
                              <span className="text-green-600 ml-2">
                                ({Math.round((1 - files[selectedImageIndex].livePreviewSize / files[selectedImageIndex].file.size) * 100)}% smaller)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3 mt-auto">
                    <button
                      onClick={() => compressSelectedImages()}
                      disabled={isProcessing || files.filter(f => f.isSelected).length === 0}
                      className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        isProcessing || files.filter(f => f.isSelected).length === 0
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isProcessing
                        ? '🔄 Processing...'
                        : files.filter(f => f.isSelected).length === 0
                          ? '⚠️ Select Images First'
                          : `🗜️ Compress Selected (${files.filter(f => f.isSelected).length})`
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <DeleteConfirmPopup
          count={pendingDeleteId === 'selected' ? files.filter(f => f.isSelected).length : 1}
          onConfirm={() => {
            if (pendingDeleteId === 'selected') {
              // Delete selected files
              const remainingFiles = files.filter(f => !f.isSelected);
              setFiles(remainingFiles);

              // Smart navigation logic
              if (remainingFiles.length === 0) {
                setSelectedImageIndex(0);
                setIsProcessing(false);
                setError('');
                setIsDownloadingZip(false);
              } else {
                if (selectedImageIndex >= remainingFiles.length) {
                  setSelectedImageIndex(remainingFiles.length - 1);
                }
              }
            } else {
              // Delete single file
              setFiles(prev => prev.filter(f => f.id !== pendingDeleteId));
              if (selectedImageIndex >= files.length - 1) {
                setSelectedImageIndex(Math.max(0, files.length - 2));
              }
            }
            setShowDeletePopup(false);
            setPendingDeleteId(null);
          }}
          onCancel={() => {
            setShowDeletePopup(false);
            setPendingDeleteId(null);
          }}
        />
      )}
        </div>
      </div>
    </>
  );
}

export default Compressor;