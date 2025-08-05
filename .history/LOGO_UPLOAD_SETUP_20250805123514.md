# Logo Upload Setup Guide

This guide explains how to set up the app logo upload feature that integrates with Hostinger storage.

## 🚀 Features

- **Drag & Drop Upload**: Easy logo upload with drag and drop support
- **Automatic Storage**: Files are automatically uploaded to Hostinger in production
- **Development Mode**: Uses base64 storage for local development
- **File Validation**: Validates file type and size (max 2MB)
- **Preview**: Real-time preview of uploaded logos
- **Responsive Design**: Works on all device sizes

## 📁 File Structure

```
src/
├── lib/
│   └── hostingerUploadService.ts    # Hostinger upload service
├── components/
│   └── ui/
│       └── LogoUpload.tsx           # Logo upload component
└── pages/
    └── SettingsPage.tsx             # Settings page with branding section
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env.production` file with your Hostinger credentials:

```bash
# Hostinger Configuration
VITE_HOSTINGER_API_TOKEN=your_hostinger_api_token_here
VITE_HOSTINGER_DOMAIN=yourdomain.com

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Get Hostinger API Token

1. Log in to your Hostinger control panel
2. Go to **API** section
3. Generate a new API token
4. Copy the token to your environment file

### 3. Configure Domain

Set your Hostinger domain in the environment file:
- Example: `yourdomain.com`
- This will be used to generate public URLs for uploaded files

## 🎯 How It Works

### Development Mode
- Detects `localhost` or development environment
- Stores logos as base64 data in the database
- Immediate preview and functionality
- No external hosting required

### Production Mode
- Detects production domain
- Uploads files to Hostinger storage
- Stores public URLs in the database
- Optimized for hosting performance

## 📱 Usage

### In Settings Page
1. Navigate to **Settings** → **Branding**
2. Drag and drop your logo or click **browse**
3. Logo will be uploaded automatically
4. Preview the logo in real-time
5. Click **Save Branding Settings** to persist changes

### Logo Requirements
- **Formats**: PNG, JPG, SVG, WebP
- **Size**: Maximum 2MB
- **Dimensions**: Recommended 200x200px
- **Quality**: High quality for best results

## 🔄 File Management

### Upload Process
1. **Validation**: Check file type and size
2. **Development**: Convert to base64
3. **Production**: Upload to Hostinger
4. **Storage**: Save URL to database
5. **Preview**: Show immediate preview

### Storage Locations
- **Development**: `app-assets/logos/` (base64 in database)
- **Production**: `app-assets/logos/` (Hostinger storage)

### File Naming
- Format: `{timestamp}-{filename}.{extension}`
- Example: `1703123456789-app-logo.png`

## 🛠️ API Endpoints

The service tries multiple Hostinger API endpoints for reliability:

```javascript
const apiEndpoints = [
  'https://api.hostinger.com/v1',
  'https://api.hostinger.com',
  'https://api.hostinger.com/v2'
];
```

## 🔍 Error Handling

### Common Issues
1. **API Token Missing**: Check environment variables
2. **Domain Not Set**: Verify VITE_HOSTINGER_DOMAIN
3. **File Too Large**: Reduce file size to under 2MB
4. **Invalid Format**: Use PNG, JPG, SVG, or WebP

### Debug Information
- Check browser console for detailed error messages
- Verify Hostinger API token permissions
- Ensure domain is correctly configured

## 🎨 Customization

### Styling
The LogoUpload component uses Tailwind CSS classes and can be customized:

```tsx
<LogoUpload
  currentLogo={settings.appLogo}
  onLogoChange={handleLogoChange}
  title="Custom Title"
  description="Custom description"
  maxSize={3} // 3MB limit
  className="custom-class"
/>
```

### Integration
To use the logo in other parts of your app:

```tsx
// Get logo from settings
const { settings } = useSettings();
const appLogo = settings.appLogo;

// Display logo
{appLogo && (
  <img src={appLogo} alt="App Logo" className="w-8 h-8" />
)}
```

## 🔒 Security

### File Validation
- File type checking
- Size limit enforcement
- Sanitized file names
- Secure upload paths

### Access Control
- Admin-only access to branding settings
- Secure API token storage
- Environment variable protection

## 📊 Performance

### Optimization
- Automatic image compression
- Lazy loading for previews
- Efficient base64 handling
- CDN delivery in production

### Monitoring
- Upload progress indicators
- Error tracking
- Success notifications
- File size validation

## 🚀 Deployment

### Production Checklist
- [ ] Set VITE_HOSTINGER_API_TOKEN
- [ ] Set VITE_HOSTINGER_DOMAIN
- [ ] Test logo upload functionality
- [ ] Verify public URL generation
- [ ] Check file access permissions

### Testing
1. Upload a test logo in development
2. Deploy to production
3. Test logo upload in production
4. Verify logo display throughout the app

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Hostinger API token
3. Ensure your domain is correctly configured
4. Test with a smaller image file
5. Check network connectivity

## 🔄 Migration

### From Base64 to Hosted
If you have existing base64 logos, they will automatically be converted to hosted URLs when uploaded in production mode.

### Backup
Always backup your logos before making changes:
- Download current logos
- Export settings data
- Keep local copies of important assets

---

**Note**: This feature requires a Hostinger hosting account with API access. For alternative hosting providers, modify the `hostingerUploadService.ts` file accordingly. 