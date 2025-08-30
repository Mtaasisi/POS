import React, { useState } from 'react';
import { EnhancedImageUploadService } from '../lib/enhancedImageUpload';
import { ImageUploadService } from '../lib/imageUpload';

export const ImageUploadDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [tempProductId] = useState('temp-product-' + Date.now());

  const testDevStorage = () => {
    const info = [];
    info.push('=== Development Storage Debug ===');
    info.push(`Temp Product ID: ${tempProductId}`);
    
    // Test EnhancedImageUploadService
    const enhancedImages = EnhancedImageUploadService.getDevImages(tempProductId);
    info.push(`EnhancedImageUploadService images: ${enhancedImages.length}`);
    
    // Test regular ImageUploadService
    // Note: We can't directly access the private devImageStorage, but we can test the update function
    
    setDebugInfo(info.join('\n'));
  };

  const simulateImageUpload = async () => {
    const info = [];
    info.push('=== Simulating Image Upload ===');
    
    // Create a mock file
    const mockFile = new File(['mock image data'], 'test-image.jpg', { type: 'image/jpeg' });
    
    try {
      const result = await EnhancedImageUploadService.uploadImage(
        mockFile,
        tempProductId,
        'test-user-id',
        { isPrimary: true }
      );
      
      info.push(`Upload result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.error) {
        info.push(`Error: ${result.error}`);
      }
      
      // Check dev storage after upload
      const enhancedImages = EnhancedImageUploadService.getDevImages(tempProductId);
      info.push(`Images in dev storage after upload: ${enhancedImages.length}`);
      
    } catch (error) {
      info.push(`Upload error: ${error}`);
    }
    
    setDebugInfo(info.join('\n'));
  };

  const testUpdateProductImages = async () => {
    const info = [];
    info.push('=== Testing Update Product Images ===');
    
    try {
      // Test the development mode storage functionality without database insert
      const devImages = EnhancedImageUploadService.getDevImages(tempProductId);
      info.push(`Found ${devImages.length} images in dev storage`);
      
      if (devImages.length > 0) {
        info.push('Image details:');
        devImages.forEach((img, index) => {
          info.push(`  ${index + 1}. ${img.fileName} (${img.fileSize} bytes)`);
        });
        
        // Test clearing the dev storage
        EnhancedImageUploadService.clearDevImages(tempProductId);
        const remainingImages = EnhancedImageUploadService.getDevImages(tempProductId);
        info.push(`After clearing: ${remainingImages.length} images remaining`);
      }
      
    } catch (error) {
      info.push(`Test error: ${error}`);
    }
    
    setDebugInfo(info.join('\n'));
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Image Upload Debug</h2>
      

      
      <div className="bg-gray-100 p-4 rounded">
        <pre className="whitespace-pre-wrap text-sm">{debugInfo || 'Click a button to run tests...'}</pre>
      </div>
    </div>
  );
};
