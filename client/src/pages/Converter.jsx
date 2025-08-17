import React, { useState, useEffect } from "react";
import { saveRecentActivity } from '../utils/dataMigration';
import DeleteConfirmPopup from '../components/DeleteConfirmPopup';
import { validateFiles, handleNetworkError, handleServerError, isFileCorrupted } from '../utils/fileValidation';

function Converter() {
  // State variables for multiple images
  const [files, setFiles] = useState([]);
  const [outputFormat, setOutputFormat] = useState("webp");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [pendingDeleteCount, setPendingDeleteCount] = useState(0);
  const [pendingDeleteFiles, setPendingDeleteFiles] = useState([]);



  // Process multiple files
  const processFiles = async (selectedFiles) => {
    setError(''); // Clear previous errors

    // Validate all files
    const validation = validateFiles(selectedFiles, 'CONVERTER');

    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    // Show validation summary if some files were rejected
    if (validation.invalidCount > 0) {
      setError(`${validation.invalidCount} files rejected. Processing ${validation.validCount} valid files.\n${validation.errors.join('\n')}`);
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

        // Create file data object with individual format selection
        const fileData = {
          id: Date.now() + Math.random(),
          file: file,
          preview: null,
          result: null,
          isProcessing: false,
          selectedFormat: 'webp', // Default format for each image (backend compatible)
          isSelected: true // Auto-select new files
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
      console.log(`✅ Successfully processed ${validProcessedFiles.length} files`);
    } else {
      setError('No valid files could be processed. Please check your files and try again.');
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
    // If no files remain after deletion, reset to upload state
    if (updatedFiles.length === 0) {
      // Reset all states to initial values
      setSelectedImageIndex(0);
      setIsProcessing(false);
      setError('');
      setIsDownloadingZip(false);
      console.log('All files deleted - returning to upload page');
    } else {
      // If files remain, adjust selectedImageIndex if needed
      if (selectedImageIndex >= updatedFiles.length) {
        setSelectedImageIndex(updatedFiles.length - 1);
      }
      console.log(`File deleted - ${updatedFiles.length} files remaining`);
    }
  };

  // Toggle image selection
  const toggleImageSelection = (fileId) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, isSelected: !f.isSelected } : f
    ));
  };

  // Smart format update with conversion refresh logic
  const updateImageFormat = (fileId, format) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        // Check if format actually changed
        const formatChanged = f.selectedFormat !== format;

        // If format changed and image was previously converted, clear the result
        // This will trigger re-conversion when user clicks convert
        if (formatChanged && f.result) {
          console.log(`Format changed for ${f.file.name}: ${f.selectedFormat} → ${format}. Clearing previous result.`);
          return {
            ...f,
            selectedFormat: format,
            result: null, // Clear previous conversion result
            isProcessing: false
          };
        }

        // If format didn't change, keep everything as is
        return { ...f, selectedFormat: format };
      }
      return f;
    }));
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
  // Smart conversion: Only convert selected images that need conversion
  const convertSelectedImages = async () => {
    setIsProcessing(true);
    setError('');

    // Smart logic: Get selected images that need conversion
    const selectedFiles = files.filter(f => f.isSelected);
    const filesToConvert = selectedFiles.filter(f => {
      // Convert if:
      // 1. No previous result, OR
      // 2. Previous result format doesn't match current selected format
      return !f.result || (f.result && f.result.newFormat !== f.selectedFormat);
    });

    const alreadyConverted = selectedFiles.filter(f =>
      f.result && f.result.newFormat === f.selectedFormat
    );

    console.log(`Smart Conversion Analysis:`);
    console.log(`- Selected images: ${selectedFiles.length}`);
    console.log(`- Already converted (matching format): ${alreadyConverted.length}`);
    console.log(`- Need conversion: ${filesToConvert.length}`);

    if (filesToConvert.length === 0) {
      setError('All selected images are already converted to their selected formats');
      setIsProcessing(false);
      return;
    }

    try {
      for (let i = 0; i < filesToConvert.length; i++) {
        const fileData = filesToConvert[i];

        // Validate format before sending (backend only accepts: jpeg, png, webp, avif)
        const validFormats = ['jpeg', 'png', 'webp', 'avif'];
        let formatToSend = fileData.selectedFormat;

        // Convert 'jpg' to 'jpeg' if needed
        if (formatToSend === 'jpg') {
          formatToSend = 'jpeg';
        }

        if (!validFormats.includes(formatToSend)) {
          setError(`Invalid format selected: ${formatToSend}. Please choose from: ${validFormats.join(', ')}`);
          setIsProcessing(false);
          return;
        }

        // Update processing state
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, isProcessing: true } : f
        ));

        // Prepare form data with validated format
        const formData = new FormData();
        formData.append("image", fileData.file);
        formData.append("format", formatToSend);

        console.log(`Converting ${fileData.file.name} to ${formatToSend}`);

        const response = await fetch("http://localhost:5000/api/image/convert", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorMessage = handleServerError(response);
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Validate response data
        if (!data.fileUrl || !data.downloadUrl) {
          throw new Error('Invalid response from server - missing file URLs');
        }

        // Update file with result using individual format
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? {
            ...f,
            isProcessing: false,
            result: {
              url: data.fileUrl,
              downloadUrl: data.downloadUrl,
              message: data.message,
              filename: data.filename,
              originalFormat: fileData.file.type.split('/')[1],
              newFormat: formatToSend
            }
          } : f
        ));

        // Save to recent activity
        await saveRecentActivity({
          type: 'conversion',
          filename: fileData.file.name,
          originalSize: fileData.file.size,
          processedUrl: data.fileUrl,
          downloadUrl: data.downloadUrl,
          originalFormat: fileData.file.type.split('/')[1],
          newFormat: formatToSend
        });
      }
    } catch (error) {
      console.error('Conversion error:', error);

      // Determine error type and provide appropriate message
      let errorMessage = 'Conversion failed: ';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage += handleNetworkError(error);
      } else if (error.message.includes('Server error')) {
        errorMessage += error.message;
      } else if (error.message.includes('Invalid response')) {
        errorMessage += 'Server returned invalid data. Please try again.';
      } else if (error.message.includes('Conversion failed')) {
        errorMessage += 'Unable to convert image. Please check the file format and try again.';
      } else {
        errorMessage += error.message || 'Unknown error occurred. Please try again.';
      }

      setError(errorMessage);

      // Reset processing state for all files
      setFiles(prev => prev.map(f => ({ ...f, isProcessing: false })));
    }

    setIsProcessing(false);
  };

  // Smart Download Function - Only download selected converted images
  const handleSmartDownload = async () => {
    // Only download selected images that have been converted
    const selectedConvertedFiles = files.filter(f => f.isSelected && f.result);
    console.log(`Smart Download: ${selectedConvertedFiles.length} selected converted files`);

    // Ensure all selected images are converted before allowing download
    const selectedFiles = files.filter(f => f.isSelected);
    if (selectedConvertedFiles.length !== selectedFiles.length) {
      setError('Please wait for all selected images to be converted before downloading');
      return;
    }

    if (selectedConvertedFiles.length === 1) {
      // Single file - Direct download using server endpoint
      console.log('Downloading single selected file directly');
      const fileData = selectedConvertedFiles[0];

      try {
        const a = document.createElement('a');
        a.href = fileData.result.downloadUrl;
        a.download = `converted_${fileData.file.name.split('.')[0]}.${fileData.result.newFormat}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('Single file download triggered successfully');
      } catch (error) {
        console.error('Single file download error:', error);
        setError('Failed to download image');
      }
    } else if (selectedConvertedFiles.length > 1) {
      // Multiple files - Download as ZIP
      console.log('Downloading multiple selected files as ZIP');
      await downloadSelectedAsZip(selectedConvertedFiles);
    }
  };

  // Download selected converted images as ZIP
  const downloadSelectedAsZip = async (selectedConvertedFiles) => {
    setIsDownloadingZip(true);
    console.log('Starting ZIP download for', selectedConvertedFiles.length, 'converted files');

    try {
      // Create ZIP file with only selected converted images
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add only selected converted images to ZIP with error handling
      await Promise.all(
        selectedConvertedFiles.map(async (fileData, index) => {
          try {
            console.log(`Fetching converted file ${index + 1}:`, fileData.result.downloadUrl);

            const response = await fetch(fileData.result.downloadUrl, {
              mode: 'cors',
              credentials: 'omit'
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            console.log(`Converted file ${index + 1} blob size:`, blob.size);

            if (blob.size === 0) {
              throw new Error('Empty file received');
            }

            const fileName = `converted_${fileData.file.name.split('.')[0]}.${fileData.result.newFormat}`;
            zip.file(fileName, blob);

            console.log(`Added ${fileName} to ZIP`);
          } catch (error) {
            console.error(`Error processing ${fileData.file.name}:`, error);
            // Add error file to ZIP for debugging
            zip.file(`ERROR_${fileData.file.name}.txt`, `Failed to download: ${error.message}`);
          }
        })
      );

      console.log('All converted files processed, generating ZIP...');

      // Generate and download ZIP immediately
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('ZIP generated, size:', zipBlob.size);

      if (zipBlob.size === 0) {
        throw new Error('Generated ZIP is empty');
      }

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_selected_images_${Date.now()}.zip`;
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
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header - Only show when no files uploaded */}
        {files.length === 0 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 Image Converter</h1>
              <p className="text-lg text-gray-600">Convert between different image formats</p>
              <p className="text-sm text-blue-600 mt-2">✨ No registration required - Convert images for free!</p>
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
              <span className="text-2xl">🔄</span>
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
            </div>
          </div>
        </div>
        )}

        {/* MULTIPLE IMAGES SECTION - Show when files are uploaded */}
        {files.length > 0 && (
          <div className="min-h-screen flex flex-col">
            {/* Compact Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
              <div className="flex items-center justify-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">🔄 Image Converter</h1>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* LEFT SIDEBAR - Functions & Controls */}
              <div className="w-full lg:w-80 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-96 lg:max-h-none">
                {/* Sidebar Header */}
                <div className="p-2 sm:p-4 border-b border-gray-200">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center">
                    🔄 Converter Controls
                  </h3>
                </div>

                {/* Add More Button */}
                <div className="p-2 sm:p-4 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📁 Add Images</h4>
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
                      <span className="font-medium text-sm sm:text-base">Add More Images</span>
                    </label>
                  </div>
                </div>

                {/* Selection Controls */}
                <div className="p-2 sm:p-4 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Selection Controls</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllImages}
                        className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllImages}
                        className="flex-1 px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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

                {/* Convert Controls */}
                <div className="p-2 sm:p-4 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">🔄 Conversion</h4>
                  <button
                    onClick={convertSelectedImages}
                    disabled={isProcessing || files.filter(f => f.isSelected).length === 0}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-sm ${
                      isProcessing || files.filter(f => f.isSelected).length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isProcessing
                      ? '🔄 Converting...'
                      : (() => {
                          const selectedFiles = files.filter(f => f.isSelected);
                          const needConversion = selectedFiles.filter(f =>
                            !f.result || (f.result && f.result.newFormat !== f.selectedFormat)
                          );
                          const alreadyConverted = selectedFiles.filter(f =>
                            f.result && f.result.newFormat === f.selectedFormat
                          );

                          if (needConversion.length === 0 && selectedFiles.length > 0) {
                            return `✅ All Selected Already Converted (${selectedFiles.length})`;
                          }

                          return `🔄 Convert ${needConversion.length}${alreadyConverted.length > 0 ? ` (${alreadyConverted.length} done)` : ''}`;
                        })()
                    }
                  </button>
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    Each image will be converted to its selected format
                  </div>
                </div>

                {/* Download Controls - Only show when there are selected images */}
                {files.length > 0 && files.some(f => f.isSelected) && (
                  <div className="p-2 sm:p-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">📥 Download</h4>
                    <button
                      onClick={() => handleSmartDownload()}
                      disabled={
                        isDownloadingZip ||
                        files.filter(f => f.isSelected).length === 0 ||
                        files.filter(f => f.isSelected && f.result).length !== files.filter(f => f.isSelected).length
                      }
                      className={`w-full px-4 py-3 rounded-lg font-bold transition-colors text-sm border-2 ${
                        isDownloadingZip ||
                        files.filter(f => f.isSelected).length === 0 ||
                        files.filter(f => f.isSelected && f.result).length !== files.filter(f => f.isSelected).length
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed border-gray-400'
                          : 'bg-green-500 text-white hover:bg-green-600 border-green-600 shadow-lg'
                      }`}
                    >
                      {isDownloadingZip
                        ? '📦 Downloading...'
                        : files.filter(f => f.isSelected).length === 0
                          ? '⚠️ Select Images First'
                          : files.filter(f => f.isSelected && f.result).length !== files.filter(f => f.isSelected).length
                            ? `⏳ Converting... (${files.filter(f => f.isSelected && f.result).length}/${files.filter(f => f.isSelected).length})`
                            : files.filter(f => f.isSelected && f.result).length === 1
                              ? '📥 Download Image'
                              : '📦 Download All ZIP'
                      }
                    </button>

                    {/* Progress indicator */}
                    <div className="mt-2 text-xs text-center">
                      {files.filter(f => f.isSelected).length > 0 && (
                        <span className={`${
                          files.filter(f => f.isSelected && f.result).length === files.filter(f => f.isSelected).length
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}>
                          {files.filter(f => f.isSelected && f.result).length} of {files.filter(f => f.isSelected).length} selected images converted
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Section */}
                <div className="flex-1 p-2 sm:p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">ℹ️ How it works</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Select images from the right panel</li>
                    <li>• Choose format for each image individually</li>
                    <li>• Click "Convert Selected" to process</li>
                    <li>• Download single file or ZIP automatically</li>
                  </ul>
                </div>
              </div>

              {/* RIGHT MAIN CONTENT - Image Cards */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div
                  className="flex-1 overflow-y-scroll p-3 sm:p-6 scrollable-area"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e0 #f7fafc',
                    maxHeight: '500px',
                    minHeight: '300px'
                  }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🖼️ Images ({files.length})</h3>

                  <div className="space-y-4">
                  {files.map((fileData, index) => (
                    <div
                      key={fileData.id}
                      className={`relative border-2 rounded-lg transition-all p-3 ${
                        fileData.isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Image Card Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={fileData.isSelected}
                          onChange={() => toggleImageSelection(fileData.id)}
                          className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors cursor-pointer"
                        />

                        {/* Small Image Preview */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          <img
                            src={fileData.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileData.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileData.file.size)} • {fileData.file.type.split('/')[1].toUpperCase()}
                          </p>
                        </div>

                        {/* Right Side - Format Selector & Status */}
                        <div className="flex items-center space-x-3">
                          {/* Format Selector Dropdown */}
                          <div className="flex flex-col items-center">
                            <label className="text-xs text-gray-600 mb-1">Convert to:</label>
                            <select
                              value={fileData.selectedFormat}
                              onChange={(e) => updateImageFormat(fileData.id, e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              disabled={fileData.isProcessing}
                            >
                              <option value="webp">WebP</option>
                              <option value="jpeg">JPEG</option>
                              <option value="png">PNG</option>
                            </select>
                          </div>

                          {/* Status Icons */}
                          <div className="flex items-center space-x-2">
                            {fileData.isProcessing && (
                              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                            )}
                            {fileData.result && (
                              <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                                ✓
                              </div>
                            )}

                            {/* Remove Button */}
                            <button
                              onClick={() => removeFile(fileData.id)}
                              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Conversion Info at Bottom */}
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
                              {fileData.file.type.split('/')[1].toUpperCase()}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-blue-100 rounded text-blue-700 font-medium">
                              {fileData.selectedFormat.toUpperCase()}
                            </span>
                          </div>

                          {/* Smart Status Display */}
                          <div className="flex items-center space-x-1">
                            {fileData.result && fileData.result.newFormat === fileData.selectedFormat ? (
                              // Already converted to selected format
                              <span className="px-2 py-1 bg-green-100 rounded text-green-700 font-medium">
                                ✅ {fileData.result.newFormat.toUpperCase()}
                              </span>
                            ) : fileData.result && fileData.result.newFormat !== fileData.selectedFormat ? (
                              // Format changed, needs re-conversion
                              <div className="flex items-center space-x-1">
                                <span className="px-2 py-1 bg-orange-100 rounded text-orange-700 font-medium">
                                  🔄 {fileData.result.newFormat.toUpperCase()}
                                </span>
                                <span className="text-orange-600 text-xs">→ Needs Update</span>
                              </div>
                            ) : (
                              // Not converted yet
                              <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
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
                // Reset all states to initial values
                setSelectedImageIndex(0);
                setIsProcessing(false);
                setError('');
                setIsDownloadingZip(false);
                console.log('All files deleted - returning to upload page');
              } else {
                // Adjust selectedImageIndex if needed
                if (selectedImageIndex >= pendingDeleteFiles.length) {
                  setSelectedImageIndex(pendingDeleteFiles.length - 1);
                }
                console.log(`Files deleted - ${pendingDeleteFiles.length} files remaining`);
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
  );
}

export default Converter;
