// Client-side background removal utility
// This is a simple implementation for completely free background removal

export const removeBackgroundClientSide = async (imageFile) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple background removal algorithm
        // This is a basic implementation - removes pixels similar to corners
        const tolerance = 50; // Adjust for sensitivity
        
        // Sample corner pixels to determine background color
        const corners = [
          [0, 0], // top-left
          [canvas.width - 1, 0], // top-right
          [0, canvas.height - 1], // bottom-left
          [canvas.width - 1, canvas.height - 1] // bottom-right
        ];

        // Get average background color from corners
        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([x, y]) => {
          const index = (y * canvas.width + x) * 4;
          bgR += data[index];
          bgG += data[index + 1];
          bgB += data[index + 2];
        });
        bgR /= corners.length;
        bgG /= corners.length;
        bgB /= corners.length;

        // Remove background pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate color difference
          const diff = Math.sqrt(
            Math.pow(r - bgR, 2) + 
            Math.pow(g - bgG, 2) + 
            Math.pow(b - bgB, 2)
          );

          // If pixel is similar to background, make it transparent
          if (diff < tolerance) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({
              url: url,
              blob: blob,
              method: 'client-side'
            });
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 1.0); // Maximum quality for PNG
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(imageFile);

    } catch (error) {
      reject(error);
    }
  });
};

// Enhanced client-side removal with edge detection
export const removeBackgroundAdvanced = async (imageFile) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // More sophisticated algorithm
        // 1. Edge detection
        // 2. Flood fill from edges
        // 3. Remove background regions

        // Simple flood fill from edges
        const visited = new Set();
        const isBackground = new Set();
        
        // Start flood fill from all edge pixels
        const edges = [];
        for (let x = 0; x < canvas.width; x++) {
          edges.push([x, 0]); // top edge
          edges.push([x, canvas.height - 1]); // bottom edge
        }
        for (let y = 0; y < canvas.height; y++) {
          edges.push([0, y]); // left edge
          edges.push([canvas.width - 1, y]); // right edge
        }

        // Flood fill algorithm
        const floodFill = (startX, startY, tolerance = 30) => {
          const stack = [[startX, startY]];
          const startIndex = (startY * canvas.width + startX) * 4;
          const startR = data[startIndex];
          const startG = data[startIndex + 1];
          const startB = data[startIndex + 2];

          while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key) || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
              continue;
            }

            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            const diff = Math.sqrt(
              Math.pow(r - startR, 2) + 
              Math.pow(g - startG, 2) + 
              Math.pow(b - startB, 2)
            );

            if (diff <= tolerance) {
              visited.add(key);
              isBackground.add(key);
              
              // Add neighbors to stack
              stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
          }
        };

        // Run flood fill from edge pixels
        edges.forEach(([x, y]) => {
          if (!visited.has(`${x},${y}`)) {
            floodFill(x, y);
          }
        });

        // Make background pixels transparent
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (isBackground.has(`${x},${y}`)) {
              const index = (y * canvas.width + x) * 4;
              data[index + 3] = 0; // Make transparent
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({
              url: url,
              blob: blob,
              method: 'client-side-advanced'
            });
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 1.0); // Maximum quality for PNG
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(imageFile);

    } catch (error) {
      reject(error);
    }
  });
};
