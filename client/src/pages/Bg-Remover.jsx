import React, { useState, useEffect } from "react";
import { saveRecentActivity } from '../utils/dataMigration';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { removeBackgroundClientSide, removeBackgroundAdvanced } from '../utils/clientBgRemoval';
import DeleteConfirmPopup from '../components/DeleteConfirmPopup';
import { validateFiles, handleNetworkError, handleServerError, isFileCorrupted } from '../utils/fileValidation';

function BgRemover() {
  // State variables for multiple images
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [pendingDeleteCount, setPendingDeleteCount] = useState(0);
  const [pendingDeleteFiles, setPendingDeleteFiles] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Auto-select first processed image
  useEffect(() => {
    const processedFiles = files.filter(f => f.result);
    if (processedFiles.length > 0) {
      const currentFile = files[selectedImageIndex];
      if (!currentFile || !currentFile.result) {
        const firstProcessedIndex = files.findIndex(f => f.result);
        if (firstProcessedIndex !== -1) {
          setSelectedImageIndex(firstProcessedIndex);
        }
      }
    }
  }, [files, selectedImageIndex]);

  // Process multiple files with comprehensive validation
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
    const validation = validateFiles(selectedFiles, 'BG_REMOVER');

    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    // Show validation summary if some files were rejected
    if (validation.invalidCount > 0) {
      setError(`${validation.invalidCount} files rejected. Adding ${validation.validCount} valid files.\n${validation.errors.join('\n')}`);
    }

    // Process valid files
    const processPromises = validation.validFiles.map(async (file) => {
      try {
        // Check if file is corrupted
        const isCorrupted = await isFileCorrupted(file);
        if (isCorrupted) {
          setError(prev => prev + `\n${file.name}: File appears to be corrupted or invalid.`);
          return null;
        }

        // Create file data object with selection
        const fileData = {
          id: Date.now() + Math.random(),
          file: file,
          preview: null,
          result: null,
          isProcessing: false,
          isSelected: true // Auto-select new images
        };

        // Create preview
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            fileData.preview = e.target.result;
            resolve(fileData);
          };
          reader.onerror = () => {
            setError(prev => prev + `\n${file.name}: Failed to read file.`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
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
      console.log(`✅ Successfully added ${validProcessedFiles.length} files to BG-Remover`);
    } else {
      setError('No valid files could be added. Please check your files and try again.');
    }
  };

  // Add more files
  const addMoreFiles = (selectedFiles) => {
    processFiles(selectedFiles);
  };

  // Smart Remove file with navigation logic
  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);

    // Smart navigation logic:
    if (updatedFiles.length === 0) {
      setIsProcessing(false);
      setError('');
      setIsDownloadingZip(false);
      console.log('All files deleted - returning to upload page');
    }
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

  // Delete selected images with smart navigation
  const deleteSelectedImages = () => {
    const selectedFiles = files.filter(f => f.isSelected);
    const remainingFiles = files.filter(f => !f.isSelected);

    if (selectedFiles.length === 0) {
      setError('Please select at least one image to delete');
      return;
    }

    setPendingDeleteCount(selectedFiles.length);
    setPendingDeleteFiles(remainingFiles);
    setShowDeletePopup(true);
  };

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
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
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  // Client-side background removal (completely free)
  const processClientSide = async (fileData) => {
    try {
      console.log(`Processing ${fileData.file.name} with client-side removal...`);
      const result = await removeBackgroundAdvanced(fileData.file);

      return {
        url: result.url,
        blob: result.blob,
        method: 'client-side'
      };
    } catch (error) {
      console.error('Client-side processing failed:', error);
      throw error;
    }
  };

  // Process selected images for background removal
  const processSelectedImages = async () => {
    setIsProcessing(true);
    setError('');

    // Get only selected images that haven't been processed yet
    const selectedFiles = files.filter(f => f.isSelected);
    const filesToProcess = selectedFiles.filter(f => !f.result);

    if (filesToProcess.length === 0) {
      setError('Please select at least one image that needs background removal');
      setIsProcessing(false);
      return;
    }

    console.log(`Processing ${filesToProcess.length} selected images for background removal`);

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const fileData = filesToProcess[i];

        // Update processing state
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, isProcessing: true } : f
        ));

        let result = null;

        try {
          // Try server-side processing first
          console.log(`Trying server-side processing for ${fileData.file.name}...`);

          const formData = new FormData();
          formData.append("image", fileData.file);

          const response = await fetch("http://localhost:5000/api/image/remove-bg", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            // Check if it's a credits exhausted error
            if (data.code === 'CREDITS_EXHAUSTED' || data.useClientSide) {
              const error = new Error(data.error || 'Credits exhausted');
              error.useClientSide = true;
              throw error;
            } else {
              const errorMessage = handleServerError(response);
              throw new Error(`Server-side processing failed: ${errorMessage}`);
            }
          }

          // Validate response data
          if (!data.fileUrl || !data.downloadUrl) {
            throw new Error('Invalid response from server - missing file URLs');
          }
          result = {
            url: data.fileUrl,
            downloadUrl: data.downloadUrl,
            message: data.message,
            filename: data.filename,
            method: 'server-side'
          };

          console.log(`Server-side processing succeeded for ${fileData.file.name}`);

        } catch (serverError) {
          console.log(`Server-side processing failed for ${fileData.file.name}:`, serverError.message);

          // If server-side fails (e.g., credit limit), try client-side
          if (serverError.useClientSide ||
              serverError.message.includes('CREDITS_EXHAUSTED') ||
              serverError.message.includes('usage limit') ||
              serverError.message.includes('credits') ||
              serverError.message.includes('Payment Required')) {

            console.log(`Falling back to client-side processing for ${fileData.file.name}...`);

            try {
              const clientResult = await processClientSide(fileData);
              result = {
                url: clientResult.url,
                downloadUrl: clientResult.url, // Same URL for client-side
                message: 'Processed with free client-side algorithm',
                filename: `bg_removed_${fileData.file.name}`,
                method: 'client-side'
              };

              console.log(`Client-side processing succeeded for ${fileData.file.name}`);

            } catch (clientError) {
              console.error(`Both server-side and client-side processing failed for ${fileData.file.name}:`, clientError);
              throw new Error(`All processing methods failed: ${clientError.message}`);
            }
          } else {
            // For other errors, don't try client-side
            throw serverError;
          }
        }

        // Update file with result
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? {
            ...f,
            isProcessing: false,
            result: result
          } : f
        ));

        // Save to recent activity
        await saveRecentActivity({
          type: 'bg-removal',
          filename: fileData.file.name,
          originalSize: fileData.file.size,
          processedUrl: result.url,
          downloadUrl: result.downloadUrl
        });
      }
    } catch (error) {
      console.error('Background removal error:', error);

      // Show helpful error messages based on the error type
      let errorMessage = 'Background removal failed: ';
      if (error.message.includes('usage limit') || error.message.includes('Insufficient credits') || error.message.includes('credits')) {
        errorMessage = '💳 Background removal service has reached its daily usage limit.\n\n📧 Please contact support to increase the processing limit or try again tomorrow.\n\n⏰ Free tier: 50 images per month\n💎 For unlimited processing, upgrade to premium service.';
      } else if (error.message.includes('Could not identify foreground')) {
        errorMessage = '❌ Could not identify a clear subject in the image. Please try:\n• Images with people, animals, or objects\n• Higher contrast between subject and background\n• Better lighting and image quality';
      } else if (error.message.includes('resolution')) {
        errorMessage = '❌ Image resolution is too low. Please use a higher quality image (at least 500x500 pixels).';
      } else if (error.message.includes('too large')) {
        errorMessage = '❌ Image file is too large. Please use an image smaller than 12MB.';
      } else if (error.message.includes('too small')) {
        errorMessage = '❌ Image file is too small. Please use a larger image.';
      } else if (error.message.includes('format')) {
        errorMessage = '❌ Unsupported image format. Please use JPG, PNG, or WebP images.';
      } else if (error.message.includes('Network')) {
        errorMessage = '❌ Network error. Please check your internet connection and try again.';
      } else {
        errorMessage += error.message;
      }

      setError(errorMessage);

      // Reset processing state for all files
      setFiles(prev => prev.map(f => ({ ...f, isProcessing: false })));
    }

    setIsProcessing(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">✂️ Background Remover</h1>
              <p className="text-lg text-gray-600">Remove backgrounds from your images instantly</p>
              <p className="text-sm text-blue-600 mt-2">✨ No registration required - Remove backgrounds for free!</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </>
        )}

        {/* UPLOAD SECTION - Show when no files uploaded */}
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
              <span className="text-2xl">🖼️</span>
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
              <p><strong>or drag and drop images here</strong></p>
              <p>Supported formats: JPEG, PNG, WebP</p>
              <p>Maximum size: 10MB per image</p>
              <p>Best results with clear subjects and contrasting backgrounds</p>
            </div>
          </div>
        </div>
        )}

        {/* SIDEBAR LAYOUT - Show when files are uploaded */}
        {files.length > 0 && (
          <div className="min-h-screen flex flex-col">
            {/* Compact Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">✂️ Background Remover</h1>
                {files.length > 0 && files.every(f => f.result) && (
                  <button
                    onClick={() => {
                      const completedFiles = files.filter(f => f.result);
                      if (completedFiles.length === 1) {
                        // Single file - Direct download with proper PNG format
                        const fileData = completedFiles[0];

                        const downloadPNG = async () => {
                          try {
                            // Use the server download endpoint
                            const a = document.createElement('a');
                            a.href = fileData.result.downloadUrl;
                            const baseFileName = fileData.file.name.replace(/\.[^/.]+$/, "");
                            a.download = `bg_removed_${baseFileName}.png`;
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          } catch (error) {
                            console.error('Download error:', error);
                            setError('Failed to download image');
                          }
                        };

                        downloadPNG();
                      } else if (completedFiles.length > 1) {
                        // Multiple files - Download as ZIP
                        setIsDownloadingZip(true);
                        import('jszip').then(({ default: JSZip }) => {
                          const zip = new JSZip();
                          Promise.all(
                            completedFiles.map(async (fileData, index) => {
                              try {
                                const response = await fetch(fileData.result.downloadUrl, {
                                  mode: 'cors',
                                  credentials: 'omit'
                                });

                                if (!response.ok) {
                                  throw new Error(`HTTP error! status: ${response.status}`);
                                }

                                const blob = await response.blob();

                                if (blob.size === 0) {
                                  throw new Error('Empty file received');
                                }

                                const baseFileName = fileData.file.name.replace(/\.[^/.]+$/, "");
                                const fileName = `bg_removed_${baseFileName}.png`;
                                zip.file(fileName, blob);
                              } catch (error) {
                                console.error(`Error processing ${fileData.file.name}:`, error);
                                const baseFileName = fileData.file.name.replace(/\.[^/.]+$/, "");
                                zip.file(`ERROR_${baseFileName}.txt`, `Failed to download: ${error.message}`);
                              }
                            })
                          ).then(() => {
                            return zip.generateAsync({ type: 'blob' });
                          }).then((zipBlob) => {
                            if (zipBlob.size === 0) {
                              throw new Error('Generated ZIP is empty');
                            }

                            const url = URL.createObjectURL(zipBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `bg_removed_images_${Date.now()}.zip`;
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            setIsDownloadingZip(false);
                          }).catch((error) => {
                            console.error('ZIP download error:', error);
                            setError(`Failed to download ZIP file: ${error.message}`);
                            setIsDownloadingZip(false);
                          });
                        });
                      }
                    }}
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
              {/* LEFT SIDEBAR - Images with Scroll */}
              <div className="w-full lg:w-80 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col h-96 lg:h-full">
                {/* Sidebar Header */}
                <div className="p-2 sm:p-4 border-b border-gray-200">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center">
                    ✂️ Images ({files.length})
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
                        selectedImageIndex === index
                          ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200'
                          : fileData.isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                      } ${fileData.result ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (fileData.result) {
                          setSelectedImageIndex(index);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={fileData.isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleImageSelection(fileData.id);
                          }}
                          className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors cursor-pointer"
                        />

                        {/* Small Image Preview */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img
                            src={fileData.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {fileData.result && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                              👁️
                            </div>
                          )}
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

                        {/* Status & Actions */}
                        <div className="flex items-center space-x-1">
                          {fileData.isProcessing && (
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="Processing..."></div>
                          )}
                          {fileData.result && (
                            <div className="w-3 h-3 bg-green-500 text-white rounded-full flex items-center justify-center text-xs" title="Processed">
                              ✓
                            </div>
                          )}

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(fileData.id);
                            }}
                            className="w-4 h-4 sm:w-3 sm:h-3 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Process Button and Download */}
                <div className="p-2 sm:p-4 border-t border-gray-200 space-y-2">
                  {(() => {
                    const selectedFiles = files.filter(f => f.isSelected);
                    const needProcessing = selectedFiles.filter(f => !f.result);
                    const processedFiles = files.filter(f => f.result);

                    return (
                      <>
                        {/* Process Button */}
                        {needProcessing.length > 0 && (
                          <button
                            onClick={() => processSelectedImages()}
                            disabled={isProcessing}
                            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                              isProcessing
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {isProcessing
                              ? '✂️ Processing...'
                              : `✂️ Remove Backgrounds (${needProcessing.length})`
                            }
                          </button>
                        )}

                        {/* Download Button */}
                        {processedFiles.length > 0 && (
                          <button
                            onClick={() => {
                              const completedFiles = files.filter(f => f.result);
                              if (completedFiles.length === 1) {
                                // Single file - Direct download with proper PNG format
                                const fileData = completedFiles[0];

                                const downloadPNG = async () => {
                                  try {
                                    console.log('Downloading from URL:', fileData.result.downloadUrl);

                                    // Use the server download endpoint
                                    const a = document.createElement('a');
                                    a.href = fileData.result.downloadUrl;
                                    const baseFileName = fileData.file.name.replace(/\.[^/.]+$/, "");
                                    a.download = `bg_removed_${baseFileName}.png`;
                                    a.style.display = 'none';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);

                                    console.log('Download triggered successfully');
                                  } catch (error) {
                                    console.error('Download error:', error);
                                    setError('Failed to download image');
                                  }
                                };

                                downloadPNG();
                              } else if (completedFiles.length > 1) {
                                // Multiple files - Download as ZIP
                                setIsDownloadingZip(true);
                                console.log('Starting ZIP download for', completedFiles.length, 'files');

                                import('jszip').then(({ default: JSZip }) => {
                                  const zip = new JSZip();

                                  Promise.all(
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

                                        const baseFileName = fileData.file.name.replace(/\.[^/.]+$/, "");
                                        const fileName = `bg_removed_${baseFileName}.png`;
                                        zip.file(fileName, blob);

                                        console.log(`Added ${fileName} to ZIP`);
                                      } catch (error) {
                                        console.error(`Error processing ${fileData.file.name}:`, error);
                                        // Add error file to ZIP for debugging
                                        const baseFileName = fileData.file.name.replace(/\.[^/.]+$/, "");
                                        zip.file(`ERROR_${baseFileName}.txt`, `Failed to download: ${error.message}`);
                                      }
                                    })
                                  ).then(() => {
                                    console.log('All files processed, generating ZIP...');
                                    return zip.generateAsync({ type: 'blob' });
                                  }).then((zipBlob) => {
                                    console.log('ZIP generated, size:', zipBlob.size);

                                    if (zipBlob.size === 0) {
                                      throw new Error('Generated ZIP is empty');
                                    }

                                    const url = URL.createObjectURL(zipBlob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `bg_removed_images_${Date.now()}.zip`;
                                    a.style.display = 'none';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    setIsDownloadingZip(false);

                                    console.log('ZIP download completed');
                                  }).catch((error) => {
                                    console.error('ZIP download error:', error);
                                    setError(`Failed to download ZIP file: ${error.message}`);
                                    setIsDownloadingZip(false);
                                  });
                                });
                              }
                            }}
                            disabled={isDownloadingZip}
                            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                              isDownloadingZip
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {isDownloadingZip
                              ? '⬇️ Downloading...'
                              : processedFiles.length === 1
                                ? '⬇️ Download'
                                : `⬇️ Download All (${processedFiles.length})`
                            }
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* RIGHT SIDE - Preview Area */}
              <div className="flex-1 bg-white flex flex-col">
                {/* Error Display */}
                {error && (
                  <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                  </div>
                )}

                {(() => {
                  const processedFiles = files.filter(f => f.result);
                  const selectedFile = files[selectedImageIndex];

                  // Show processed image - either selected one or first processed one
                  let displayFile = null;
                  if (processedFiles.length > 0) {
                    if (selectedFile && selectedFile.result) {
                      displayFile = selectedFile;
                    } else {
                      displayFile = processedFiles[0]; // Show first processed image as fallback
                    }
                  }

                  if (processedFiles.length > 0) {
                    // Always show something if there are processed files
                    const fileToShow = displayFile || processedFiles[0];

                    return (
                      <div className="flex-1 p-4 overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4">🔍 Preview: {fileToShow.file.name}</h2>

                        {/* Full Size Before/After Slider for Selected Image */}
                        <div className="w-full">
                          <BeforeAfterSlider
                            beforeImage={fileToShow.preview}
                            afterImage={fileToShow.result.url}
                            beforeLabel="Original"
                            afterLabel="Background Removed"
                            showTransparency={true}
                            className="w-full h-96 md:h-[500px]"
                          />
                        </div>

                        <p className="text-sm text-gray-500 text-center mt-4">
                          Drag to compare • Click and drag the slider to see the difference
                        </p>

                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-600">
                            Click on other processed images in the left sidebar to preview them
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center text-gray-500">
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">✂️</span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Remove Backgrounds</h3>
                          <p className="text-sm">Select images from the left sidebar and click "Remove Backgrounds" to start processing.</p>

                          {/* Quality Information */}
                          <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200 max-w-md mx-auto">
                            <h4 className="font-medium text-yellow-900 mb-2">⚡ Quality Note</h4>
                            <p className="text-sm text-yellow-800">
                              Free API may produce lower quality results. For professional-grade quality with higher resolution and better edge detection, consider upgrading to premium APIs.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {showDeletePopup && (
          <DeleteConfirmPopup
            count={pendingDeleteCount}
            onConfirm={() => {
              setFiles(pendingDeleteFiles);

              // Smart navigation logic:
              if (pendingDeleteFiles.length === 0) {
                setIsProcessing(false);
                setError('');
                setIsDownloadingZip(false);
                console.log('All files deleted - returning to upload page');
              }

              setShowDeletePopup(false);
              setPendingDeleteCount(0);
              setPendingDeleteFiles([]);
            }}
            onCancel={() => {
              setShowDeletePopup(false);
              setPendingDeleteCount(0);
              setPendingDeleteFiles([]);
            }}
          />
        )}
        </div>
      </div>
    </>
  );
}

export default BgRemover;
