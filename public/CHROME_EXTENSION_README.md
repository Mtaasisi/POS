# LATS CHANCE WhatsApp Chrome Extension

This Chrome extension adds a shortcut button to WhatsApp Web for quick access to your LATS CHANCE management interface.

## Features

- ⚡ **Floating Shortcut Button** - Always visible on WhatsApp Web
- 📊 **Quick Dashboard Access** - One-click access to your management interface
- 🔧 **Connection Testing** - Test your webhook connection
- 📈 **Real-time Stats** - View message and ticket counts
- 🎨 **Beautiful UI** - Modern design that matches WhatsApp

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension Files**
   - Copy all files from the `public/` folder to a new directory on your computer

2. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files

4. **Configure the Extension**
   - Open `chrome-extension-content-script.js`
   - Update the `appUrl` to your actual domain:
   ```javascript
   appUrl: 'https://your-actual-domain.com/whatsapp/chrome-extension'
   ```

### Method 2: Create Extension Package

1. **Create Extension Directory**
   ```bash
   mkdir lats-chance-extension
   cd lats-chance-extension
   ```

2. **Copy Files**
   - Copy all files from `public/` to this directory

3. **Create Icons** (Optional)
   - Create `icons/` folder
   - Add icon files: `icon16.png`, `icon48.png`, `icon128.png`

4. **Package Extension**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select your extension directory
   - This creates a `.crx` file

## Usage

### 1. Install the Extension
Follow the installation steps above.

### 2. Open WhatsApp Web
- Go to https://web.whatsapp.com
- Log in to your WhatsApp account

### 3. Use the Shortcut Button
- Look for the **⚡ LATS CHANCE** button in the top-right corner
- Click it to open your management dashboard
- Use the Chrome extension icon in the toolbar for additional options

### 4. Configure Webhook
In your Chrome extension webhook interface:
- **Webhook URL**: `https://your-domain.com/api/chrome-extension-webhook`
- **Active**: Turn ON
- **Events**: Select "Messages" and "CRM"

## Features Explained

### Floating Shortcut Button
- **Position**: Top-right corner of WhatsApp Web
- **Color**: WhatsApp green (#25D366)
- **Hover Effect**: Darker green with slight lift animation
- **Click**: Opens your LATS CHANCE dashboard in new tab

### Chrome Extension Popup
- **Status Indicator**: Shows connection status
- **Quick Actions**: Dashboard, Test Connection, Settings
- **Statistics**: Real-time message and ticket counts
- **Auto-refresh**: Updates every 30 seconds

### Keyboard Shortcut
- **Ctrl/Cmd + Shift + L**: Quick access to dashboard
- Works anywhere on WhatsApp Web

## Configuration

### Update App URL
Edit `chrome-extension-content-script.js`:
```javascript
const CONFIG = {
    appUrl: 'https://your-actual-domain.com/whatsapp/chrome-extension',
    // ... other config
};
```

### Customize Button
Edit the button appearance in `chrome-extension-content-script.js`:
```javascript
const CONFIG = {
    buttonText: 'LATS CHANCE',  // Change button text
    buttonIcon: '⚡',           // Change icon
    // ... styling options
};
```

### Add Custom Features
The extension is modular and easy to extend:
- Add new buttons to the popup
- Create additional keyboard shortcuts
- Integrate with other APIs

## Troubleshooting

### Button Not Appearing
1. Check if you're on WhatsApp Web (`web.whatsapp.com`)
2. Refresh the page
3. Check browser console for errors
4. Verify extension is enabled

### Connection Issues
1. Test connection from extension popup
2. Verify your app URL is correct
3. Check if your app is running
4. Ensure webhook is configured properly

### Extension Not Working
1. Go to `chrome://extensions/`
2. Find LATS CHANCE extension
3. Click "Reload" button
4. Refresh WhatsApp Web

## Development

### File Structure
```
public/
├── chrome-extension-manifest.json    # Extension configuration
├── chrome-extension-content-script.js # Main script (injects button)
├── popup.html                        # Extension popup UI
├── popup.js                          # Popup functionality
└── CHROME_EXTENSION_README.md        # This file
```

### Making Changes
1. Edit the files in `public/`
2. Go to `chrome://extensions/`
3. Click "Reload" on your extension
4. Refresh WhatsApp Web

### Testing
1. Open WhatsApp Web
2. Check if button appears
3. Test all functionality
4. Check browser console for errors

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your configuration
3. Test connection from extension popup
4. Check browser console for error messages

## Version History

- **v1.0.0**: Initial release with floating button and popup
- Features: Basic shortcut, connection testing, statistics display
