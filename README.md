# Per-Tab Audio Control Extension

A cross-browser extension that provides granular audio control for each browser tab with volume adjustment, dynamic compression, and a 3-band equalizer. Settings are automatically saved per URL with flexible matching options.

## Features

- **Volume Control**: Adjust volume from 0% to 200% per tab
- **Dynamic Compression**: Control audio dynamics with threshold and ratio settings
- **3-Band Equalizer**: Bass, mid, and treble frequency adjustments
- **URL-Based Persistence**: Save settings for exact URLs, paths, or entire domains
- **Cross-Browser Support**: Compatible with Chrome (Manifest V3) and Firefox (Manifest V2)

## Installation

### Chrome/Chromium-based browsers

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the extension folder containing `manifest.json`
5. The extension should now appear in your extensions list

### Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the extension folder and select `manifest_v2.json`
5. The extension will be loaded temporarily (until browser restart)

### Firefox Permanent Installation

For permanent installation in Firefox:

1. Rename `manifest_v2.json` to `manifest.json`
2. Package the extension as a `.zip` file
3. Sign the extension through Mozilla's Add-on Developer Hub
4. Install the signed `.xpi` file

## File Structure

```
extension/
├── manifest.json          # Chrome Manifest V3
├── manifest_v2.json      # Firefox Manifest V2
├── background.js         # Background service worker
├── content.js           # Content script for audio interception
├── audio-processor.js   # Web Audio API processing engine
├── popup.html          # Extension popup interface
├── popup.css           # Popup styling
├── popup.js            # Popup control logic
├── storage-manager.js  # Settings persistence manager
└── icons/
    ├── icon16.svg      # 16x16 icon
    ├── icon48.svg      # 48x48 icon
    └── icon128.svg     # 128x128 icon
```

## Usage

1. **Opening Controls**: Click the extension icon in your browser toolbar
2. **Volume Adjustment**: Use the volume slider to control tab volume (0-200%)
3. **Compression Settings**:
   - **Threshold**: Set the level where compression begins (-100 to 0 dB)
   - **Ratio**: Control compression intensity (1:1 to 20:1)
4. **Equalizer**: Adjust bass, mid, and treble frequencies (-12 to +12 dB)
5. **Save Settings**: Choose how to save your settings:
   - **Exact URL**: Settings apply only to the current complete URL
   - **Path**: Settings apply to all pages under the current path
   - **Domain**: Settings apply to all pages on the current domain
6. **Reset**: Click "Reset to Default" to restore original settings

## Technical Details

### Audio Processing

The extension uses the Web Audio API to create a processing chain:
```
Audio Source → Bass Filter → Mid Filter → Treble Filter → Compressor → Volume → Output
```

- **Bass Filter**: Low-shelf filter at 320 Hz
- **Mid Filter**: Peaking filter at 1000 Hz  
- **Treble Filter**: High-shelf filter at 3200 Hz
- **Compressor**: Dynamic range compressor with configurable threshold and ratio
- **Volume**: Master gain control

### Browser Compatibility

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Manifest V3 | ✅ | ❌ | ✅ |
| Manifest V2 | ❌ | ✅ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ |
| Extension Storage | ✅ | ✅ | ✅ |

### Settings Storage

Settings are stored using the browser's extension storage API with keys based on the selected match type:

- **Exact**: Full URL (e.g., `https://example.com/page?param=value`)
- **Path**: Hostname + pathname (e.g., `example.com/page`)
- **Domain**: Hostname only (e.g., `example.com`)

## Development

### Testing Locally

1. Start a local HTTP server for development:
   ```bash
   python3 -m http.server 5000
   ```

2. Load the extension in your browser using the installation instructions above

3. Open browser developer tools to view console logs for debugging

### Building for Production

For Chrome Web Store submission:
1. Ensure `manifest.json` (V3) is present
2. Create a ZIP file with all extension files
3. Upload to Chrome Web Store Developer Dashboard

For Firefox Add-ons:
1. Rename `manifest_v2.json` to `manifest.json`
2. Create a ZIP file with all extension files
3. Submit to Mozilla Add-on Developer Hub for review

## Troubleshooting

### Extension Not Working

1. **Check Permissions**: Ensure the extension has access to the current site
2. **Reload Extension**: Disable and re-enable the extension
3. **Check Console**: Open browser developer tools and check for error messages
4. **Audio Context**: Some sites require user interaction before audio processing works

### No Audio Control

1. **Refresh Page**: Reload the page after installing the extension
2. **Check Audio Elements**: Ensure the page has `<audio>` or `<video>` elements
3. **Web Audio Support**: Verify the site uses Web Audio API or standard media elements

### Settings Not Saving

1. **Storage Permissions**: Ensure extension has storage permissions
2. **Check Match Type**: Verify the correct URL matching option is selected
3. **Browser Storage**: Check if browser storage limits are exceeded

## Privacy

This extension:
- Only processes audio locally in your browser
- Does not send any data to external servers
- Stores settings locally using browser storage APIs
- Only accesses audio from tabs you explicitly visit

## License

This project is open source. Feel free to modify and distribute according to your needs.