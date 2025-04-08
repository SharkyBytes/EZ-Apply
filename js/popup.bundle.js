class Popup {
    constructor(manager=null) {
        console.log('[EZ-Apply] Initializing Popup class');
        this.auto_fill_btn = null;
        this.auto_fill_edit_btn = null;
        this.manager = manager;
        this.popup = this.create_popup();
        this.hide_popup();
    }

    create_popup() {
        console.log('[EZ-Apply] Creating popup DOM element');
        let popup = document.createElement("div");
        popup.id = "popup_toast";
        popup.style = "top: 18px; right: 18px; position: fixed; z-index: 10000000000000; padding-right: 0rem !important; padding-left: 0rem !important; width: 32rem;";
        popup.classList.add("autofill_toast", "autofill_d-none");
        popup.setAttribute("data-autohide", "false");
        document.body.appendChild(popup);

        // Add debugging to fetch operation
        try {
            fetch(chrome.runtime.getURL('popup.html'))
                .then(response => {
                    console.log('[EZ-Apply] Popup HTML fetch response:', response.status);
                    return response.text();
                })
                .then(data => {
                    console.log('[EZ-Apply] Popup HTML content loaded');
                    popup.innerHTML = data;
                    
                    // Check and log whether elements were found
                    this.auto_fill_btn = document.getElementById("auto_fill_btn");
                    if (this.auto_fill_btn) {
                        console.log('[EZ-Apply] Found auto_fill_btn');
                    } else {
                        console.error('[EZ-Apply] auto_fill_btn not found in popup HTML');
                    }
                    
                    this.auto_fill_edit_btn = document.getElementById("auto_fill_edit_btn");
                    if (this.auto_fill_edit_btn) {
                        console.log('[EZ-Apply] Found auto_fill_edit_btn');
                    } else {
                        console.error('[EZ-Apply] auto_fill_edit_btn not found in popup HTML');
                    }
                    
                    this.add_event_listeners();
                })
                .catch(error => {
                    console.error('[EZ-Apply] Error loading popup HTML:', error);
                });
        } catch (error) {
            console.error('[EZ-Apply] Error in fetch operation:', error);
        }
        
        return popup;
    }

    add_event_listeners() {
        console.log('[EZ-Apply] Adding event listeners to popup buttons');
        let self = this;
        
        if (this.auto_fill_btn) {
            console.log('[EZ-Apply] Adding click listener to auto_fill_btn');
            this.auto_fill_btn.addEventListener("click", function(event) {
                console.log('[EZ-Apply] Autofill button clicked');
                event.preventDefault();
                if (self.manager) {
                    console.log('[EZ-Apply] Calling manager.change()');
                    self.manager.change();
                } else {
                    console.error('[EZ-Apply] Manager is not available');
                }
                self.hide_popup();
            }, false);
        }
        
        if (this.auto_fill_edit_btn) {
            console.log('[EZ-Apply] Adding click listener to auto_fill_edit_btn');
            this.auto_fill_edit_btn.addEventListener("click", function(event) {
                console.log('[EZ-Apply] Edit profile button clicked');
                event.preventDefault();
                chrome.runtime.sendMessage({message: "open_edit_page"});
            }, false);
        }
    }

    show_popup() {
        console.log('[EZ-Apply] Showing popup');
        if (this.popup) {
            this.popup.classList.remove("autofill_d-none");
            try {
                $('#popup_toast').toast('show');
            } catch (error) {
                console.error('[EZ-Apply] Error showing toast:', error);
            }
        } else {
            console.error('[EZ-Apply] Popup element is not available');
        }
    }

    hide_popup() {
        console.log('[EZ-Apply] Hiding popup');
        try {
            $('#popup_toast').toast('hide');
        } catch (error) {
            console.error('[EZ-Apply] Error hiding toast:', error);
        }
    }
}

// Add debug logging for initialization
console.log('[EZ-Apply] Popup script loaded');