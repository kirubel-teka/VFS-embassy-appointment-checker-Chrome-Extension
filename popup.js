// popup.js - Handles user interaction in the extension popup

document.addEventListener('DOMContentLoaded', function() {
    const vfsUrlInput = document.getElementById('vfsUrl');
    const userEmailInput = document.getElementById('userEmail');
    const userPasswordInput = document.getElementById('userPassword');
    const enableToggle = document.getElementById('enableToggle');
    const saveSettingsButton = document.getElementById('saveSettings');
    const statusMessage = document.getElementById('statusMessage');

    // Get references to the visual toggle elements using more robust selectors
    // The input is sr-only, its visual components are its siblings within the .relative container
    const toggleContainer = enableToggle.closest('.relative');
    const toggleTrack = toggleContainer.querySelector('.block');
    const toggleDot = toggleContainer.querySelector('.dot');

    // Helper function to apply styling based on toggle state
    function updateToggleStyling(isChecked, trackElement, dotElement) {
        if (isChecked) {
            trackElement.classList.remove('bg-gray-600');
            trackElement.classList.add('bg-green-500');
            dotElement.classList.remove('translate-x-0');
            dotElement.classList.add('translate-x-full');
        } else {
            trackElement.classList.add('bg-gray-600');
            trackElement.classList.remove('bg-green-500');
            dotElement.classList.add('translate-x-0');
            dotElement.classList.remove('translate-x-full');
        }
    }

    // Load saved settings when the popup opens
    chrome.storage.local.get(['vfsUrl', 'userEmail', 'userPassword', 'isEnabled'], function(result) {
        vfsUrlInput.value = result.vfsUrl || '';
        userEmailInput.value = result.userEmail || '';
        userPasswordInput.value = result.userPassword || ''; // Passwords stored are not ideal, but for functionality
        enableToggle.checked = result.isEnabled || false;

        // Apply initial toggle switch styling based on loaded state
        updateToggleStyling(enableToggle.checked, toggleTrack, toggleDot);
    });

    // Save settings when the "Save Settings" button is clicked
    saveSettingsButton.addEventListener('click', function() {
        const vfsUrl = vfsUrlInput.value;
        const userEmail = userEmailInput.value;
        const userPassword = userPasswordInput.value;
        const isEnabled = enableToggle.checked;

        if (!vfsUrl || !userEmail || !userPassword) {
            statusMessage.textContent = 'Please fill in all fields.';
            statusMessage.style.color = 'red';
            return;
        }

        chrome.storage.local.set({
            vfsUrl: vfsUrl,
            userEmail: userEmail,
            userPassword: userPassword,
            isEnabled: isEnabled
        }, function() {
            statusMessage.textContent = 'Settings saved successfully!';
            statusMessage.style.color = 'green';

            // Send a message to the background script to update the alarm
            chrome.runtime.sendMessage({
                action: 'updateAlarm',
                isEnabled: isEnabled
            });
        });
    });

    // Update toggle switch styling on change
    enableToggle.addEventListener('change', function() {
        // 'this' refers to the enableToggle input itself
        updateToggleStyling(this.checked, toggleTrack, toggleDot);
    });
});
