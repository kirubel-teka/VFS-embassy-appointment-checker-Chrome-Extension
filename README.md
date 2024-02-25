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

3. **Add the Extension to Chrome:**
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked".
   - Select the outer `vfs_telegram_notifier` folder and click "Select".
   - The extension will now be loaded.

4. **Configure and Use:**
   - Click the extension icon in Chrome.
   - Enter your login URL, email, and password.
   - Toggle the "Activate" button and save settings.
   - The extension will start automated checking and send notifications to your Telegram.

## Icons

Icons are provided in 16x16, 48x48, and 128x128 PNG formats in the `icons/` directory.

---

**Note:**  
Make sure your PHP server is accessible from your browser and is configured to allow requests from the extension.

---

**Designed for Ethiopians for Italy appointment**