// Image utility functions to handle large images and prevent HTTP 431 errors

export const compressImage = (file: File, maxSize: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.8); // 80% quality
    };

    img.src = URL.createObjectURL(file);
  });
};

export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const validateImageSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
};

// Function to handle image upload with compression
export const processImageForUpload = async (file: File): Promise<{
  file: File;
  base64: string;
  dimensions: { width: number; height: number };
}> => {
  // Validate file size
  if (!validateImageSize(file)) {
    throw new Error(`Image size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Get original dimensions
  const dimensions = await getImageDimensions(file);

  // Compress image if needed
  const compressedFile = await compressImage(file);
  
  // Convert to base64
  const base64 = await convertToBase64(compressedFile);

  return {
    file: compressedFile,
    base64,
    dimensions
  };
};

// Image utilities for handling loading errors and fallbacks

// List of unreliable image services that should be blocked
const UNRELIABLE_IMAGE_SERVICES = [
  'via.placeholder.com',
  'placehold.it',
  'placehold.co',
  'dummyimage.com',
  'picsum.photos',
  'lorempixel.com',
  'loremflickr.com'
];

// Generate a fallback SVG image
export function generateFallbackImage(width: number = 400, height: number = 400, text: string = 'Image'): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Check if a URL is from an unreliable service
export function isUnreliableImageService(url: string): boolean {
  if (!url) return true;
  
  try {
    const urlObj = new URL(url);
    return UNRELIABLE_IMAGE_SERVICES.some(service => 
      urlObj.hostname.includes(service)
    );
  } catch {
    return true; // Invalid URL
  }
}

// Validate image URL
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:', 'data:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
    // Check protocol
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // Check if it's a data URL
    if (urlObj.protocol === 'data:') {
      return url.includes('image/');
    }
    
    // Check file extension
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    );
    
    return hasValidExtension;
  } catch {
    return false;
  }
}

// Get a safe image URL with fallback
export function getSafeImageUrl(url: string, fallbackText: string = 'Image'): string {
  if (!url) {
    return generateFallbackImage(400, 400, fallbackText);
  }
  
  // Check if URL is from unreliable service
  if (isUnreliableImageService(url)) {
    return generateFallbackImage(400, 400, fallbackText);
  }
  
  // Check if URL is valid
  if (!isValidImageUrl(url)) {
    return generateFallbackImage(400, 400, fallbackText);
  }
  
  return url;
}

// Handle image loading error
export function handleImageError(event: Event, fallbackText: string = 'Image'): void {
  const img = event.target as HTMLImageElement;
  if (img) {
    img.src = generateFallbackImage(400, 400, fallbackText);
    img.alt = fallbackText;
  }
}

// Preload image with timeout
export function preloadImage(url: string, timeout: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!url || isUnreliableImageService(url)) {
      reject(new Error('Unreliable image service'));
      return;
    }
    
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('Image load timeout'));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(url);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load failed'));
    };
    
    img.src = url;
  });
}
