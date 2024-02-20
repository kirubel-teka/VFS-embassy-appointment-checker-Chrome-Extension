async function automateVFS() {
    console.log('Content Script: Starting VFS automation...');

    // Function to wait for an element to appear in the DOM
    function waitForElement(selector, timeout = 20000, interval = 1000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element with selector "${selector}" not found within timeout of ${timeout}ms.`));
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }

    try {
        // Get stored credentials from local storage
        const result = await chrome.storage.local.get(['userEmail', 'userPassword']);
        const { userEmail, userPassword } = result;

        if (!userEmail || !userPassword) {
            console.error('Content Script: User credentials not found.');
            return { status: 'error', message: 'Credentials not provided in extension popup.' };
        }

        // --- Step 1: Attempt Login ---
        console.log('Content Script: Attempting to find login elements...');
        const emailFieldSelector = '#email';
        const passwordFieldSelector = '#password';
        const loginButtonSelector = 'button.btn.mat-btn-lg.btn-block.btn-brand-orange';

        let emailField, passwordField, loginButton;

        try {
            emailField = await waitForElement(emailFieldSelector);
            passwordField = await waitForElement(passwordFieldSelector);
            loginButton = await waitForElement(loginButtonSelector);
            console.log('Content Script: All login elements found.');
        } catch (selectorError) {
            console.error('Content Script: Failed to find one or more login elements:', selectorError.message);
            return { status: 'error', message: `Login element not found. Page structure might have changed. Error: ${selectorError.message}` };
        }

        // Add a 25-second delay for Cloudflare/page stability
        console.log('Content Script: Waiting 7 seconds for Cloudflare/page stability...');
        await new Promise(resolve => setTimeout(resolve, 7000));

        // --- Check and click Cloudflare checkbox if present ---
        const cloudflareCheckboxSelector = 'input[type="checkbox"]';
        try {
            const cloudflareCheckbox = await waitForElement(cloudflareCheckboxSelector, 10000);
            if (cloudflareCheckbox && !cloudflareCheckbox.checked) {
                console.log('Content Script: Cloudflare checkbox found and clicking...');
                cloudflareCheckbox.click();
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log('Content Script: Cloudflare checkbox clicked, waiting for page to settle.');
            }
        } catch (checkboxError) {
            console.log('Content Script: Cloudflare checkbox not found or not visible, proceeding with login. Error:', checkboxError.message);
        }

        // --- Fill credentials and login ---
        console.log('Content Script: Filling credentials and simulating user input...');
        emailField.focus();
        emailField.value = userEmail;
        emailField.dispatchEvent(new Event('input', { bubbles: true }));
        emailField.dispatchEvent(new Event('change', { bubbles: true }));
        emailField.blur();

        await new Promise(resolve => setTimeout(resolve, 500));

        passwordField.focus();
        passwordField.value = userPassword;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        passwordField.blur();

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Content Script: Simulating login button click...');
        loginButton.click();

        // --- Step 2: Confirm Login Success and Click "Start New Booking" ---
        const startNewBookingButtonSelector = 'button.mat-mdc-raised-button';
        let startNewBookingButton;

        try {
            startNewBookingButton = await waitForElement(startNewBookingButtonSelector, 4000);
            console.log('Content Script: "Start New Booking" button found. Login appears successful.');
            startNewBookingButton.click();
            console.log('Content Script: "Start New Booking" button clicked.');
            await new Promise(resolve => setTimeout(resolve, 11000));
            console.log('Content Script: 11-second wait after "Start New Booking" complete.');
        } catch (bookingButtonError) {
            console.error('Content Script: Login failed or "Start New Booking" button not found:', bookingButtonError.message);
            const loginErrorMessageElement = document.querySelector('.error-message, .alert-danger, #loginErrorMessage');
            const errorMessageText = loginErrorMessageElement ? loginErrorMessageElement.textContent.trim() : 'Unknown login error. "Start New Booking" button missing.';
            return { status: 'error', message: `Login failed or button not found: ${errorMessageText}` };
        }

        // --- Step 3: Select Application Category ("Legalization") ---
        console.log('Content Script: Attempting to select category "Legalization"...');
        const categoryDropdownSelector = '#mat-select-4';
        let categoryDropdown;

        try {
            categoryDropdown = await waitForElement(categoryDropdownSelector, 5000);
            console.log('Content Script: "Select Category" dropdown found, clicking...');
            categoryDropdown.click();
            await new Promise(resolve => setTimeout(resolve, 2000));

            const legalizationOptionSelector = '#LE';
            const legalizationOption = await waitForElement(legalizationOptionSelector, 5000);

            if (legalizationOption) {
                console.log('Content Script: "Legalization" option found, clicking...');
                legalizationOption.click();
                await new Promise(resolve => setTimeout(resolve, 7000));
                console.log('Content Script: "Legalization" selected and 7-second wait complete.');
            } else {
                console.error('Content Script: "Legalization" option not found.');
                return { status: 'error', message: 'Could not select "Legalization" category.' };
            }
        } catch (categoryError) {
            console.error('Content Script: Error selecting category:', categoryError.message);
            return { status: 'error', message: `Failed to select application category: ${categoryError.message}` };
        }

        // --- Step 4: Check for Appointment Availability ---
        console.log('Content Script: Checking for appointment availability...');
        const availableSlotIndicatorSelector = '.available-slot, .slot-green, .date-has-slots, .calendar-day.available, [data-status="available"], #availableDatesList, .has-open-slots';
        const noAppointmentMessageSelector = 'div.alert.alert-info.border-0.rounded-0.alert-info-blue';

        let availableSlotIndicator = document.querySelector(availableSlotIndicatorSelector);
        let noAppointmentMessageElement = document.querySelector(noAppointmentMessageSelector);

        if (availableSlotIndicator) {
            console.log('Content Script: Appointment slot(s) FOUND!');
            return { status: 'appointment_found', message: 'Appointment slots available!' };
        } else if (noAppointmentMessageElement) {
            const messageText = noAppointmentMessageElement.textContent.trim();
            console.log('Content Script: No appointment slots found. Message:', messageText);
            return { status: 'appointment_not_found', message: `No appointment slots found: ${messageText}` };
        } else {
            console.log('Content Script: Could not determine appointment availability.');
            return { status: 'appointment_not_found', message: 'Availability status unclear. Selectors might need update.' };
        }
    } catch (error) {
        console.error('Content Script: Automation error:', error);
        return { status: 'error', message: `Automation script critical error: ${error.message}` };
    }
}

// Execute the automation function and notify background script
automateVFS().then(result => {
    console.log('Content Script: Automation complete, sending result to background script:', result);
    chrome.runtime.sendMessage({
        action: 'automation_complete',
        result: result
    });
}).catch(error => {
    console.error('Content Script: Automation failed:', error);
    chrome.runtime.sendMessage({
        action: 'automation_complete',
        result: { status: 'error', message: `Unexpected error: ${error.message}` }
    });
});