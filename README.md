# vfs_telegram_notifier

A browser extension that sends notifications to Telegram using a PHP backend.

## Project Structure

```
vfs_telegram_notifier/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content_script.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── send_telegram_message.php
```

## Usage

1. **Clone or Download** this repository.

2. **Set up the PHP Backend:**
   - Place `send_telegram_message.php` on your web server.
   - Edit the file to include your Telegram Bot Token and Chat ID.

3. **Load the Extension in Your Browser:**
   - Open your browser's extensions page (e.g., `chrome://extensions/` in Chrome).
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `vfs_telegram_notifier` folder.

4. **Configure and Use:**
   - Click the extension icon.
   - Enter the required details in the popup (if applicable).
   - The extension will send notifications to your Telegram via the PHP backend.

## Icons

Icons are provided in 16x16, 48x48, and 128x128 PNG formats in the `icons/` directory.

---

**Note:**  
Make sure your PHP server is accessible from your browser and is configured to allow requests from