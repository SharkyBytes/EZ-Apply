// Handle edit profile page functionality
console.log('[EZ-Apply] Edit profile page loaded');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[EZ-Apply] Edit profile page DOM ready');
    
    // Make sure cancel button works
    const cancelButton = document.getElementById('cancel');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            console.log('[EZ-Apply] Cancel button clicked');
            window.close();
        });
    }
    
    // Make sure save button works properly
    const saveButton = document.getElementById('save');
    if (saveButton) {
        const form = document.getElementById('editprofileform');
        
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('[EZ-Apply] Save button clicked - saving form data');
            
            try {
                // This function should already be defined in editprofile.bundle.js
                // Just making sure the submit handler is working
                if (typeof get_form_data === 'function') {
                    get_form_data();
                } else {
                    console.error('[EZ-Apply] get_form_data function not found');
                }
            } catch (error) {
                console.error('[EZ-Apply] Error saving form data:', error);
            }
        });
    }
}); 