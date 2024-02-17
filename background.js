// background.js - This is the service worker script that runs in the background.

// Function to create and display a Chrome notification
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png', // Make sure you have icons in 'icons' folder
        title: title,
        message: message,
        priority: 2
    });
}

// Function to send a Telegram notification via the backend
async function sendTelegramNotification(subject, body, userEmail) { // userEmail is included for context if backend needs it
    // IMPORTANT: You MUST replace 'YOUR_TELEGRAM_BACKEND_API_ENDPOINT' with the actual
    // URL of your PHP script on cPanel that sends Telegram messages.
    const telegramApiUrl = 'YOUR_TELEGRAM_BACKEND_API_ENDPOINT'; // <<< REPLACE THIS

    // IMPORTANT: Replace 'YOUR_SHARED_SECRET_TOKEN' with a strong, unique token.
    // This token must match the one set in your PHP script for authentication.
    const authToken = 'asdijv2918ASDIAWFVNusjsbquq182471nabdg'; // <<< REPLACE THIS

    if (telegramApiUrl === 'YOUR_TELEGRAM_BACKEND_API_ENDPOINT' || authToken === 'YOUR_SHARED_SECRET_TOKEN') {
        console.warn('Telegram notification skipped: Backend API URL or Auth Token not configured.');
        return;
    }

    try {
        console.log(`Attempting to send Telegram notification with subject: ${subject}`);
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // Sending the authentication token
            },
            body: JSON.stringify({
                subject: subject,
                message: body, // Changed 'body' to 'message' to match PHP expectation
                recipient_email: userEmail // Optional: pass user's VFS email for context in Telegram
            })
        });

        if (response.ok) {
            console.log('Telegram notification successfully sent via backend.');
        } else {
            const errorText = await response.text();
            console.error('Failed to send Telegram notification via backend:', response.status, errorText);
            showNotification('Telegram Error', `Failed to send Telegram: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        showNotification('Telegram Error', `Error sending Telegram: ${error.message}`);
    }
}



// Optional: Initial check when the service worker starts up
chrome.runtime.onInstalled.addListener(() => {
    console.log('VFS Appointment Notifier installed.');
    chrome.storage.local.get('isEnabled', function(result) {
        if (result.isEnabled) {
            // Ensure the alarm is set if the extension was already enabled
            chrome.alarms.create('vfsCheckAlarm', {
                delayInMinutes: 0.1, // Start almost immediately on install/update if enabled
                periodInMinutes: 1
            });
        }
    });
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'automation_complete') {
        console.log('Background Script: Received automation result:', message.result);
        // Close the tab that sent the message
        if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id, () => {
                if (chrome.runtime.lastError) {
                    console.error('Background Script: Error closing tab:', chrome.runtime.lastError.message);
                } else {
                    console.log('Background Script: Tab closed successfully.');
                }
            });
        } else {
            console.error('Background Script: No valid tab ID to close.');
        }
    }
});