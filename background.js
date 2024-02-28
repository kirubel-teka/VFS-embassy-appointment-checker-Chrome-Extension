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


// Main function to start the VFS appointment check process
async function checkVFSAppointments() {
    console.log('VFS Appointment Checker: Initiating check...');
    showNotification('VFS Checker', 'Starting appointment check...');

    try {
        const result = await chrome.storage.local.get(['vfsUrl', 'userEmail', 'userPassword', 'isEnabled']);
        const { vfsUrl, userEmail, userPassword, isEnabled } = result;

        if (!isEnabled) {
            console.log('VFS Appointment Checker: Disabled by user. Skipping check.');
            return;
        }

        if (!vfsUrl || !userEmail || !userPassword) {
            console.error('VFS Appointment Checker: Missing configuration. Please set URL, email, and password in popup.');
            showNotification('VFS Checker Error', 'Missing configuration. Please set URL, email, and password.');
            return;
        }

        console.log(`VFS Appointment Checker: Attempting to navigate to ${vfsUrl}`);

        // Create a new tab or update an existing one to perform the login and check
        // This method creates a new tab for interaction. For security and to avoid
        // interfering with the user's current browsing, it's often better to open
        // a dedicated, possibly hidden tab.
        const tab = await chrome.tabs.create({ url: vfsUrl, active: false }); // Open in background tab

        // Wait for the tab to load before injecting content script
        await new Promise(resolve => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });

        console.log(`VFS Appointment Checker: Tab loaded, injecting content script into tab ID: ${tab.id}`);

        // Inject the content script into the VFS login page
        const response = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_script.js']
        });

        // The content script will return a result (e.g., success/failure of login/check)
        // We can then process this result.
        // Assuming the content script returns an array of results,
        // and we are interested in the first one.
        if (response && response[0] && response[0].result) {
            const scriptResult = response[0].result;
            console.log('VFS Appointment Checker: Content script reported:', scriptResult);

            if (scriptResult.status === 'login_success') {
                showNotification('VFS Checker', 'Successfully logged into VFS page.');
                sendTelegramNotification('VFS Checker - Successful Login', 'Your VFS Appointment Checker successfully logged into the VFS page.', userEmail);
            } else if (scriptResult.status === 'appointment_found') {
                showNotification('VFS Appointment FOUND!', 'A new appointment slot has been found! Check the VFS page immediately.');
                sendTelegramNotification('VFS Appointment FOUND!', `A new appointment slot has been found! Check the VFS page immediately: ${vfsUrl}`, userEmail);
                // Here, you could add logic to attempt booking if desired,
                // but it's highly complex and site-specific.
                // For simplicity, we just notify.
            } else if (scriptResult.status === 'appointment_not_found') {
                showNotification('VFS Checker', 'No appointment slots found this minute.');
                sendTelegramNotification('VFS Checker - No Appointment Found', 'No appointment slots found this minute.', userEmail);
            } else if (scriptResult.status === 'error') {
                showNotification('VFS Checker Error', `An error occurred: ${scriptResult.message}`);
                console.error('VFS Appointment Checker Error:', scriptResult.message);
                sendTelegramNotification('VFS Checker - Error', `An error occurred during VFS check: ${scriptResult.message}`, userEmail);
            }
        } else {
            console.error('VFS Appointment Checker: Content script did not return expected result.');
            showNotification('VFS Checker Error', 'Content script communication failed.');
            sendTelegramNotification('VFS Checker - Communication Error', 'Content script communication failed with the VFS Checker extension.', userEmail);
        }

        // Close the tab after processing to clean up
        // await chrome.tabs.remove(tab.id);

    } catch (error) {
        console.error('VFS Appointment Checker: Unhandled error during check:', error);
        showNotification('VFS Checker Critical Error', `An unexpected error occurred: ${error.message}`);
        sendTelegramNotification('VFS Checker - Critical Error', `An unexpected critical error occurred: ${error.message}`, userEmail);
    }
}

// Set up the alarm to trigger the check every minute
chrome.alarms.create('vfsCheckAlarm', {
    delayInMinutes: 1, // Start after 1 minute
    periodInMinutes: 1 // Repeat every 1 minute
});

// Listener for the alarm
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'vfsCheckAlarm') {
        chrome.storage.local.get('isEnabled', function(result) {
            if (result.isEnabled) {
                checkVFSAppointments();
            } else {
                console.log('VFS Appointment Checker: Alarm triggered, but checker is disabled.');
            }
        });
    }
});

// Listener for messages from the popup script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateAlarm') {
        if (request.isEnabled) {
            // If enabled, ensure the alarm is active
            chrome.alarms.create('vfsCheckAlarm', {
                delayInMinutes: 0.1, // Start almost immediately when re-enabled
                periodInMinutes: 1
            });
            console.log('VFS Appointment Checker: Alarm enabled and re-created.');
        } else {
            // If disabled, clear the alarm
            chrome.alarms.clear('vfsCheckAlarm');
            console.log('VFS Appointment Checker: Alarm disabled and cleared.');
        }
    }
});

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