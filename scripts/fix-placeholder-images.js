// Fix placeholder images in the browser
// Run this in the browser console to replace all placeholder images

function fixPlaceholderImages() {
  console.log('🖼️ Fixing placeholder images...');
  
  // Find all images with placeholder URLs
  const images = document.querySelectorAll('img[src*="via.placeholder.com"], img[src*="placehold.it"], img[src*="placehold.co"]');
  
  console.log(`Found ${images.length} placeholder images to fix`);
  
  images.forEach((img, index) => {
    const originalSrc = img.src;
    
    // Generate a local SVG placeholder
    const svg = `
      <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#F8FAFC"/>
        <text x="200" y="200" font-family="Arial, sans-serif" font-size="16" fill="#64748B" text-anchor="middle" dy=".3em">Product Image</text>
      </svg>
    `;
    
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    
    // Replace the src
    img.src = dataUrl;
    img.alt = 'Product Image';
    
    console.log(`Fixed image ${index + 1}: ${originalSrc} -> local SVG`);
  });
  
  console.log('✅ Placeholder images fixed!');
}

// Also fix any background images
function fixBackgroundImages() {
  console.log('🎨 Fixing background images...');
  
  const elements = document.querySelectorAll('*');
  let fixedCount = 0;
  
  elements.forEach(element => {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    
    if (backgroundImage && backgroundImage.includes('via.placeholder.com')) {
      const svg = `
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#F8FAFC"/>
          <text x="200" y="200" font-family="Arial, sans-serif" font-size="16" fill="#64748B" text-anchor="middle" dy=".3em">Product Image</text>
        </svg>
      `;
      
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      element.style.backgroundImage = `url("${dataUrl}")`;
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} background images`);
}

// Run both fixes
fixPlaceholderImages();
fixBackgroundImages();

console.log('🎉 All placeholder images have been fixed!');
