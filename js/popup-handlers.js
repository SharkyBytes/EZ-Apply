// Debug helper
function logDebug(message) {
    console.log('[EZ-Apply Popup]', message);
    document.getElementById('debug-status').textContent = 'Status: ' + message;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    logDebug('Popup loaded');
    
    // Set up button handlers
    document.getElementById('auto_fill_btn').addEventListener('click', function() {
        logDebug('Autofill button clicked');
        // Send message to active tab to fill form
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            logDebug('Sending autofill command to tab: ' + tabs[0].id);
            chrome.tabs.sendMessage(
                tabs[0].id,
                {action: "autofill"},
                function(response) {
                    if (chrome.runtime.lastError) {
                        logDebug('Error: ' + chrome.runtime.lastError.message);
                    } else if (response) {
                        logDebug('Response: ' + JSON.stringify(response));
                    }
                }
            );
        });
    });

    document.getElementById('auto_fill_edit_btn').addEventListener('click', function() {
        logDebug('Edit profile button clicked - sending message to background script');
        try {
            chrome.runtime.sendMessage({message: "open_edit_page"}, function(response) {
                if (chrome.runtime.lastError) {
                    logDebug('Error: ' + chrome.runtime.lastError.message);
                } else {
                    logDebug('Message sent successfully');
                }
            });
            logDebug('Message sent, closing popup');
            window.close();
        } catch (error) {
            logDebug('Error sending message: ' + error.message);
        }
    });

    // Close button
    document.querySelector('.autofill_close').addEventListener('click', function() {
        window.close();
    });
}); 