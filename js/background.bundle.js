// Add debugging
console.log('[EZ-Apply] Background script loaded');
console.log('[EZ-Apply] Extension URL:', chrome.runtime.getURL(''));
console.log('[EZ-Apply] Index page URL:', chrome.runtime.getURL('index.html'));

// Set default popup immediately on startup
chrome.action.setPopup({ popup: 'popup.html' });

// Handle button click
chrome.action.onClicked.addListener((tab) => {
    console.log('[EZ-Apply] Extension icon clicked on tab:', tab.url);
    
    // For chrome:// and chrome-extension:// URLs, we already set the popup
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        console.log('[EZ-Apply] Cannot inject scripts on protected URLs');
        return;
    }
    
    // For regular URLs, try to execute the content script
    console.log('[EZ-Apply] Executing content script');
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: injectContentScript,
        args: []
    }).then(() => {
        console.log('[EZ-Apply] Content script executed successfully');
    }).catch(error => {
        console.error('[EZ-Apply] Error executing content script:', error);
        // If script injection fails, ensure popup works as fallback
        chrome.action.setPopup({ popup: 'popup.html' });
    });
});

// Content script injection function
function injectContentScript() {
    console.log('[EZ-Apply] Content script injected');
    try {
        if (typeof autofill_manager !== 'undefined' && autofill_manager.popup !== null) {
            console.log('[EZ-Apply] Showing popup via autofill_manager');
            autofill_manager.popup.show_popup();
        } else {
            console.log('[EZ-Apply] autofill_manager not found or popup is null');
            // Send message back to show popup instead
            chrome.runtime.sendMessage({message: "show_popup_fallback"});
        }
    } catch (error) {
        console.error('[EZ-Apply] Error in content script:', error);
        chrome.runtime.sendMessage({message: "content_script_error", error: error.message});
    }
}

// Message listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('[EZ-Apply] Message received in background script:', request);
    
    if (request.message === "open_edit_page") {
        console.log('[EZ-Apply] Opening edit page from background script');
        try {
            const indexUrl = chrome.runtime.getURL('index.html');
            console.log('[EZ-Apply] Opening URL:', indexUrl);
            chrome.tabs.create({url: indexUrl}, function(tab) {
                if (chrome.runtime.lastError) {
                    console.error('[EZ-Apply] Error creating tab:', chrome.runtime.lastError);
                } else {
                    console.log('[EZ-Apply] Tab created successfully:', tab.id);
                }
            });
        } catch (error) {
            console.error('[EZ-Apply] Error in open_edit_page handler:', error);
        }
        return true;
    }
    
    if (request.message === "show_popup_fallback") {
        console.log('[EZ-Apply] Showing popup fallback');
        // Ensure popup is set
        chrome.action.setPopup({ popup: 'popup.html' });
        return true;
    }
    
    if (request.message === "content_script_error") {
        console.error('[EZ-Apply] Content script reported error:', request.error);
        return true;
    }

    return false; // No valid handler found
});