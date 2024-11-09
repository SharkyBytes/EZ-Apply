class ExeManager {
    constructor(currentUrl) {
        this.currentUrl = currentUrl;
        this.isCompanyDataAvailable = false;
        this.isUserDataAvailable = false;
        this.companyData = null;
        this.userData = null;
        this.auto_fill = null;
        this.popup = null;
    }

    change() {
        try {
            if (!this.isCompanyDataAvailable && this.companyData === null){
                this.isCompanyDataAvailable = true;
                this.companyData = new CompanyData(this.currentUrl, this);
                console.log("Company data initialized");
                return;
            }
            if (!this.isUserDataAvailable && this.userData === null){
                this.isUserDataAvailable = true;
                this.userData = new UserData(this);
                console.log("User data initialized");
                return;
            }
            if (this.isCompanyDataAvailable && this.isUserDataAvailable && this.companyData !== null && this.userData !== null) {
                this.auto_fill = new AutoFill(this.userData.resume_json, 
                    this.userData.resume_file, 
                    this.userData.cover_letter,
                    this.companyData.job_portal_type,
                    this);
                this.auto_fill.resume_task();
                console.log("AutoFill initialized");
            } else {
                console.log("Data not available to initialize AutoFill");
            } 
        } catch (error) {
            console.error("Error in change():", error);
        }
    }

    create_popup() {
        try {
            this.popup = new Popup(this);
            console.log("Popup created");
        } catch (error) {
            console.error("Error creating popup:", error);
        }
    }

    remove_popup() {
        this.popup = null;
        console.log("Popup removed");
    }
}

// Example usage:
var autofill_manager = new ExeManager(document.URL);
autofill_manager.create_popup();
autofill_manager.change();
