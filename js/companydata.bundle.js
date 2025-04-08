const CompanyType  = {
    greenhouse: 'greenhouse',
    lever: 'lever',
    googleforms: 'googleforms',  // Add Google Forms support
    general: 'general',         // Add general support for other websites
    unknown: 'unknown'         // Keep unknown for error handling
}

class CompanyData{
    constructor(currentUrl, exeManager){
        console.log('[EZ-Apply] Initializing CompanyData with URL:', currentUrl);
        this.currentUrl = currentUrl;
        this.job_portal_type = this.getJobPortalName();
        this.company_name = this.getCompanyName();
        console.log('[EZ-Apply] Detected job portal:', this.job_portal_type);
        console.log('[EZ-Apply] Detected company name:', this.company_name);
        exeManager.change();
    }

    getCompanyName(){
        try {
            if (this.job_portal_type === CompanyType.greenhouse){
                const parts = this.currentUrl.split('/');
                if (parts.length > 3) {
                    return parts[3];
                }
                console.error('[EZ-Apply] Invalid URL format for Greenhouse');
                return 'unknown';
            }
            if (this.job_portal_type === CompanyType.lever){
                const parts = this.currentUrl.split('/');
                if (parts.length > 3) {
                    return parts[3];
                }
                console.error('[EZ-Apply] Invalid URL format for Lever');
                return 'unknown';
            }
            if (this.job_portal_type === CompanyType.googleforms){
                return 'Google Forms';
            }
            if (this.job_portal_type === CompanyType.general){
                // Extract domain name as company name for general websites
                try {
                    const url = new URL(this.currentUrl);
                    const hostParts = url.hostname.split('.');
                    if (hostParts.length >= 2) {
                        return hostParts[hostParts.length - 2]; // Return the domain name without TLD
                    }
                    return url.hostname;
                } catch(e) {
                    return 'website';
                }
            }
            // Handle unknown portal types
            console.warn('[EZ-Apply] Unknown job portal type, cannot determine company name');
            return 'unknown';
        } catch (error) {
            console.error('[EZ-Apply] Error getting company name:', error);
            return 'unknown';
        }
    }

    getJobPortalName(){
        try {
            if (this.currentUrl.includes('greenhouse')){
                return CompanyType.greenhouse;
            }
            if (this.currentUrl.includes('lever')){
                return CompanyType.lever;
            }
            if (this.currentUrl.includes('docs.google.com/forms')){
                console.log('[EZ-Apply] Detected Google Forms');
                return CompanyType.googleforms;
            }
            
            // If not a specific recognized job portal, handle as general website
            console.log('[EZ-Apply] Using general website handler');
            return CompanyType.general;
        } catch (error) {
            console.error('[EZ-Apply] Error detecting job portal type:', error);
            return CompanyType.unknown;
        }
    }

    printCompanyData(){
        console.log(`[EZ-Apply] Company Name: ${this.company_name}`);
        console.log(`[EZ-Apply] Portal Name: ${this.job_portal_type}`);
    }
}

// Add debug logging for initialization
console.log('[EZ-Apply] CompanyData script loaded');