class ExeManager {
    constructor(currentUrl) {
        console.log('[EZ-Apply] Initializing ExeManager with URL:', currentUrl);
        this.currentUrl = currentUrl;
        this.isCompanyDataAvailable = false;
        this.isUserDataAvailable = false;
        this.companyData = null;
        this.userData = null;
        this.auto_fill = null;
        this.popup = null;
    }

    change() {
        console.log('[EZ-Apply] ExeManager.change() called');
        try {
            if (!this.isCompanyDataAvailable && this.companyData === null){
                console.log('[EZ-Apply] Initializing company data');
                this.isCompanyDataAvailable = true;
                try {
                    this.companyData = new CompanyData(this.currentUrl, this);
                    console.log("[EZ-Apply] Company data initialized successfully");
                } catch (error) {
                    console.error("[EZ-Apply] Error initializing company data:", error);
                    this.isCompanyDataAvailable = false;
                }
                return;
            }
            
            if (!this.isUserDataAvailable && this.userData === null){
                console.log('[EZ-Apply] Initializing user data');
                this.isUserDataAvailable = true;
                try {
                    this.userData = new UserData(this);
                    console.log("[EZ-Apply] User data initialized successfully");
                } catch (error) {
                    console.error("[EZ-Apply] Error initializing user data:", error);
                    this.isUserDataAvailable = false;
                }
                return;
            }
            
            if (this.isCompanyDataAvailable && this.isUserDataAvailable && this.companyData !== null && this.userData !== null) {
                console.log('[EZ-Apply] All data available, initializing AutoFill');
                
                // Add checks for userData properties
                if (!this.userData.resume_json) {
                    console.error('[EZ-Apply] User resume data not available');
                    return;
                }
                
                try {
                    this.auto_fill = new AutoFill(
                        this.userData.resume_json, 
                        this.userData.resume_file, 
                        this.userData.cover_letter,
                        this.companyData.job_portal_type,
                        this
                    );
                    this.auto_fill.resume_task();
                    console.log("[EZ-Apply] AutoFill initialized and resume task executed");
                } catch (error) {
                    console.error("[EZ-Apply] Error in AutoFill:", error);
                }
            } else {
                console.log("[EZ-Apply] Data not available to initialize AutoFill:");
                console.log("  - Company data available:", this.isCompanyDataAvailable);
                console.log("  - User data available:", this.isUserDataAvailable);
                console.log("  - Company data object:", this.companyData ? "exists" : "null");
                console.log("  - User data object:", this.userData ? "exists" : "null");
            } 
        } catch (error) {
            console.error("[EZ-Apply] Error in change():", error);
        }
    }

    create_popup() {
        console.log('[EZ-Apply] Creating popup');
        try {
            this.popup = new Popup(this);
            console.log("[EZ-Apply] Popup created successfully");
        } catch (error) {
            console.error("[EZ-Apply] Error creating popup:", error);
        }
    }

    remove_popup() {
        console.log('[EZ-Apply] Removing popup');
        this.popup = null;
    }
}

// Add debug logging
console.log('[EZ-Apply] Manager script loaded');

// Initialize ExeManager
var autofill_manager = new ExeManager(document.URL);
console.log('[EZ-Apply] Created autofill_manager instance');

// Create popup with delay to ensure DOM is ready
setTimeout(function() {
    console.log('[EZ-Apply] Creating popup after delay');
    autofill_manager.create_popup();
    // Initialize data with additional delay
    setTimeout(function() {
        console.log('[EZ-Apply] Initializing data after delay');
        autofill_manager.change();
    }, 1000);
}, 1000);
