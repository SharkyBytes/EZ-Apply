class UserData{
    constructor(exeManager){
        console.log('[EZ-Apply] Initializing UserData');
        this.resume_json = null;
        this.resume_file = null;
        this.cover_letter = null;
        this.exeManager = exeManager;
        this.get_user_data();
    }
    
    async get_user_data(){
        console.log('[EZ-Apply] Getting user data');
        var tempSelf = this;
        
        try {
            return chrome.storage.local.get(["userdata", "resume", "coverletter"], function (result) {
                console.log('[EZ-Apply] User data retrieved from storage:', result ? 'data exists' : 'no data');
                var userData = result.userdata;
                var resume = result.resume;
                var coverletter = result.coverletter;
                var BASE64_MARKER = ';base64,';
                
                if (userData) {
                    console.log('[EZ-Apply] Using stored user data');
                    tempSelf.resume_json = userData;
                } else {
                    console.log('[EZ-Apply] No stored user data, trying to load sample data');
                    tempSelf.load_sample_data();
                }
                
                if (resume) {
                    console.log('[EZ-Apply] Processing resume file');
                    try {
                        var base64Index = resume["text"].indexOf(BASE64_MARKER) + BASE64_MARKER.length;
                        var base64 = resume["text"].substring(base64Index);
                        var binary_string = window.atob(base64);
                        var bytes = new Uint8Array(binary_string.length);
                        for (var i = 0; i < binary_string.length; i++) {
                            bytes[i] = binary_string.charCodeAt(i);
                        }
                        var dataTransfer = new DataTransfer();
                        dataTransfer.items.add(new File([new Blob([bytes], {type: "application/pdf"})], resume["name"], {type: "application/pdf", lastModified: resume["lastModified"], lastModifiedDate: resume["lastModifiedDate"]}));
                        tempSelf.resume_file = dataTransfer;
                        console.log('[EZ-Apply] Resume file processed successfully');
                    } catch (error) {
                        console.error('[EZ-Apply] Error processing resume file:', error);
                    }
                } else {
                    console.log('[EZ-Apply] No resume file found');
                }
                
                if (coverletter) {
                    console.log('[EZ-Apply] Processing cover letter file');
                    try {
                        var base64Index = coverletter["text"].indexOf(BASE64_MARKER) + BASE64_MARKER.length;
                        var base64 = coverletter["text"].substring(base64Index);
                        var binary_string = window.atob(base64);
                        var bytes = new Uint8Array(binary_string.length);
                        for (var i = 0; i < binary_string.length; i++) {
                            bytes[i] = binary_string.charCodeAt(i);
                        }
                        var dataTransfer = new DataTransfer();
                        dataTransfer.items.add(new File([new Blob([bytes], {type: "application/pdf"})], coverletter["name"], {type: "application/pdf", lastModified: coverletter["lastModified"], lastModifiedDate: coverletter["lastModifiedDate"]}));
                        tempSelf.cover_letter = dataTransfer;
                        console.log('[EZ-Apply] Cover letter processed successfully');
                    } catch (error) {
                        console.error('[EZ-Apply] Error processing cover letter file:', error);
                    }
                } else {
                    console.log('[EZ-Apply] No cover letter found');
                }
                
                // Continue with manager change
                tempSelf.exeManager.change();
            });
        } catch (error) {
            console.error('[EZ-Apply] Error getting user data from storage:', error);
            // Try fallback to sample data
            this.load_sample_data();
            this.exeManager.change();
        }
    }

    // Method to load sample data if no user data exists
    load_sample_data() {
        console.log('[EZ-Apply] Loading sample user data');
        try {
            fetch(chrome.runtime.getURL('data/sample_user_data.json'))
                .then(response => {
                    console.log('[EZ-Apply] Sample data fetch response:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('[EZ-Apply] Sample data loaded successfully');
                    this.resume_json = data;
                    // Store the sample data for future use
                    chrome.storage.local.set({userdata: data}, function() {
                        console.log('[EZ-Apply] Sample data stored in local storage');
                    });
                })
                .catch(error => {
                    console.error('[EZ-Apply] Error loading sample data:', error);
                });
        } catch (error) {
            console.error('[EZ-Apply] Error in loading sample data:', error);
        }
    }

    printUserData(){
        console.log(`[EZ-Apply] User data:`, this.resume_json);
    }
}

// Add debug logging for initialization
console.log('[EZ-Apply] UserData script loaded');