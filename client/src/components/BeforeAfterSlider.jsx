import React, { useState, useRef, useEffect } from 'react';

function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Processed",
  className = "",
  showTransparency = false // New prop to show transparency pattern for BG removal
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Handle mouse/touch events
  const handleStart = (e) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    setSliderPosition(percentage);
  };

  // Add global event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e) => handleMove(e);
      const handleGlobalEnd = () => handleEnd();

      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalMove);
      document.addEventListener('touchend', handleGlobalEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isDragging]);

  if (!beforeImage || !afterImage) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">Upload and process an image to see the comparison</p>
      </div>
    );
  }

  // Create transparency pattern style for background removal
  const transparencyPattern = showTransparency ? {
    backgroundImage: `
      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  } : {};

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-lg ${showTransparency ? '' : 'bg-gray-100'} ${className}`}
      style={showTransparency ? transparencyPattern : {}}
    >
      {/* Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] cursor-col-resize select-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* After Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-contain"
            style={{ minHeight: '100%', minWidth: '100%' }}
            draggable={false}
          />
          {/* After Label */}
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            {afterLabel}
          </div>
        </div>

        {/* Before Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-contain"
            style={{ minHeight: '100%', minWidth: '100%' }}
            draggable={false}
          />
          {/* Before Label */}
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            {beforeLabel}
          </div>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-xl z-10 cursor-col-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border-3 border-gray-200 flex items-center justify-center hover:scale-110 transition-transform">
            <div className="flex space-x-1">
              <div className="w-1 h-6 bg-gray-500 rounded"></div>
              <div className="w-1 h-6 bg-gray-500 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
        ↔️ Drag to compare
      </div>
    </div>
  );
}

export default BeforeAfterSlider;
