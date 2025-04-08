class AutoFill {
    constructor(resume_json, resume_file, cover_letter=null, job_portal_type=0, manager=null) {
        this.resume_json = resume_json;
        this.resume_file = resume_file;
        this.cover_letter = cover_letter;
        this.job_portal_type = job_portal_type;
        this.manager = manager;
        this.forms = null;
        this.form = null;
    }

    get_forms(){
        console.log('[EZ-Apply] Getting forms from the page');
        
        try {
            this.forms = document.forms;
            console.log(`[EZ-Apply] Found ${this.forms.length} forms on the page`);
            
            if (this.forms.length > 0) {
                this.form = document.forms[0];
                console.log('[EZ-Apply] Selected first form for autofill');
            } else {
                console.warn('[EZ-Apply] No forms found on the page');
                this.form = null;
            }
        } catch (error) {
            console.error('[EZ-Apply] Error getting forms:', error);
            this.forms = null;
            this.form = null;
        }
    }

    fill_text_field(field, label){
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase())){
                field.value = this.resume_json[key];
                field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                return;
            }
        }
    }

    fill_select_field(field, label){
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase())){
                if (field.type == "select-one"){
                    for(var i = 0; i < field.options.length; i++){
                        if (Array.isArray(this.resume_json[key])){
                            this.resume_json[key].forEach(value => {
                                if(field.options[i].value != ""){
                                    if(field.options[i].text.toLowerCase().includes(value.toLowerCase())){
                                        field.options[i].selected = true;
                                        field.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                        return;
                                    }
                                }
                            });
                        }else{
                            if(field.options[i].value != ""){
                                if(field.options[i].text.toLowerCase().includes(this.resume_json[key].toLowerCase())){
                                    field.options[i].selected = true;
                                    field.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                    return;
                                }
                            }
                        }
                        
                    }
                }
                else {
                    if (Array.isArray(this.resume_json[key])){
                        this.resume_json[key].forEach(value => {
                            if (field.parentNode.innerText.toLowerCase().includes(value.toLowerCase())){
                                field.checked = true;
                                field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                return;
                            }
                        });
                    }else{
                        if (field.parentNode.innerText.toLowerCase().trim() == this.resume_json[key].toLowerCase().trim()){
                            field.checked = true;
                            field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                            return;
                        }
                    }
                }
            }
        }
    }

    upload_files(){
        console.log('[EZ-Apply] Attempting to upload files');
        
        if (!this.job_portal_type) {
            console.warn('[EZ-Apply] No job portal type detected, cannot upload files');
            return;
        }
        
        try {
            switch(this.job_portal_type){
                case CompanyType.greenhouse:
                    console.log('[EZ-Apply] Uploading files to Greenhouse portal');
                    this.upload_greenhouse();
                    break;
                case CompanyType.lever:
                    console.log('[EZ-Apply] Uploading files to Lever portal');
                    this.upload_lever();
                    break;
                case CompanyType.googleforms:
                    console.log('[EZ-Apply] Google Forms detected - trying to upload files');
                    this.upload_googleforms();
                    break;
                case CompanyType.general:
                    console.log('[EZ-Apply] General website - looking for file upload fields');
                    this.upload_general();
                    break;
                default:
                    console.warn(`[EZ-Apply] Unknown job portal type: ${this.job_portal_type}`);
            }
        } catch (error) {
            console.error('[EZ-Apply] Error in upload_files:', error);
        }
    }

    fill_resume() {
        console.log('[EZ-Apply] Starting to fill resume data');
        
        try {
            this.get_forms();  // Ensure this method sets `this.form` correctly
            
            // Check if `this.form` is defined before accessing its properties
            if (this.form) {
                console.log('[EZ-Apply] Form found, proceeding with autofill');
                
                // Special handling for Google Forms
                if (this.job_portal_type === CompanyType.googleforms) {
                    this.fill_googleforms();
                    return;
                }
                
                // Special handling for general websites
                if (this.job_portal_type === CompanyType.general) {
                    this.fill_general_website();
                    return;
                }
                
                // Standard form filling logic for job portals
                try {
                    var labels = this.form.getElementsByTagName("label");
                    console.log(`[EZ-Apply] Found ${labels.length} labels in the form`);
                    
                    for (var i = 0; i < labels.length; i++) {
                        try {
                            if (!labels[i].parentNode) {
                                console.warn(`[EZ-Apply] Label at index ${i} has no parent node, skipping`);
                                continue;
                            }
                            
                            var label = labels[i].parentNode.innerText.split("\n")[0];
                            
                            // Process input elements
                            var elements = labels[i].parentNode.getElementsByTagName("input");
                            for(var j = 0; j < elements.length; j++){
                                var element = elements[j];
                                if(element != null && element.type != 'hidden') {
                                    if (element.type == "text" || element.type == "email"){
                                        this.fill_text_field(element, label);
                                    } else if (element.type == "radio" || element.type == "checkbox"){
                                        this.fill_select_field(element, label);
                                    }
                                }
                            }
                    
                            // Process select elements
                            elements = labels[i].parentNode.getElementsByTagName("select");
                            for(var j = 0; j < elements.length; j++){
                                var element = elements[j];
                                if(element != null && element.type != 'hidden') {
                                    this.fill_select_field(element, label);
                                }
                            }
                        } catch (labelError) {
                            console.error(`[EZ-Apply] Error processing label at index ${i}:`, labelError);
                        }
                    }
                    
                    // Call other methods as needed
                    try {
                        this.check_fill_education();
                    } catch (educationError) {
                        console.error('[EZ-Apply] Error filling education:', educationError);
                    }
                    
                    try {
                        this.upload_files();
                    } catch (uploadError) {
                        console.error('[EZ-Apply] Error uploading files:', uploadError);
                    }
                    
                    console.log('[EZ-Apply] Resume filling completed');
                } catch (formProcessingError) {
                    console.error('[EZ-Apply] Error processing form:', formProcessingError);
                }
            } else {
                console.error("[EZ-Apply] Form element is not found or undefined.");
            }
        } catch (error) {
            console.error('[EZ-Apply] Error in fill_resume:', error);
        }
    }
    
    resume_task() {
        if (this.resume_json !== null && this.resume_file !== null) {
            this.fill_resume();
        }
    }
    
    fill_education_greenhouse(education, idx){
        console.log(`[EZ-Apply] Filling education at index ${idx} for Greenhouse`);
        
        try {
            // Add education section if not the first one
            if(idx != 0){
                const addEducationBtn = document.getElementById("add_education");
                if (addEducationBtn) {
                    console.log('[EZ-Apply] Clicking add education button');
                    addEducationBtn.click();
                } else {
                    console.warn('[EZ-Apply] Add education button not found');
                }
            }
            
            // Set school name
            const schoolName = document.getElementById("education_school_name_" + idx);
            if (!schoolName) {
                console.error(`[EZ-Apply] School name field not found for index ${idx}`);
                return;
            }
            
            if (!education.school_value) {
                console.warn('[EZ-Apply] No school_value in education data');
            } else {
                schoolName.value = education.school_value;
                schoolName.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
            }
            
            // Update school name in display
            const schoolNameUpdate = document.getElementById("s2id_education_school_name_" + idx);
            if (schoolNameUpdate) {
                const chosenEls = schoolNameUpdate.getElementsByClassName("select2-chosen");
                if (chosenEls.length > 0) {
                    chosenEls[0].innerText = education.school || '';
                    chosenEls[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                } else {
                    console.warn('[EZ-Apply] select2-chosen element not found for school');
                }
            }
            
            // Set degree
            const degree = document.getElementById("education_degree_" + idx);
            const degreeUpdate = document.getElementById("s2id_education_degree_" + idx);
            
            if (degree) {
                let degreeMatched = false;
                for(var i = 0; i < degree.options.length; i++){
                    if(degree.options[i].value != ""){
                        if(degree.options[i].text.toLowerCase().includes((education.degreetype || '').toLowerCase())){
                            degree.options[i].selected = true;
                            degree.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                            
                            if (degreeUpdate) {
                                const chosenEls = degreeUpdate.getElementsByClassName("select2-chosen");
                                if (chosenEls.length > 0) {
                                    chosenEls[0].innerText = degree.options[i].text;
                                    chosenEls[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                }
                            }
                            
                            degreeMatched = true;
                            break;
                        }
                    }
                }
                
                if (!degreeMatched) {
                    console.warn(`[EZ-Apply] No matching degree found for: ${education.degreetype}`);
                }
            } else {
                console.warn(`[EZ-Apply] Degree select not found for index ${idx}`);
            }
            
            // Set discipline/major
            const discipline = document.getElementById("education_discipline_" + idx);
            const disciplineUpdate = document.getElementById("s2id_education_discipline_" + idx);
            
            if (discipline) {
                let disciplineMatched = false;
                for(var i = 0; i < discipline.options.length; i++){
                    if(discipline.options[i].value != ""){
                        if(discipline.options[i].text.toLowerCase().includes((education.major || '').toLowerCase())){
                            discipline.options[i].selected = true;
                            discipline.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                            
                            if (disciplineUpdate) {
                                const chosenEls = disciplineUpdate.getElementsByClassName("select2-chosen");
                                if (chosenEls.length > 0) {
                                    chosenEls[0].innerText = discipline.options[i].text;
                                    chosenEls[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                }
                            }
                            
                            disciplineMatched = true;
                            break;
                        }
                    }
                }
                
                if (!disciplineMatched) {
                    console.warn(`[EZ-Apply] No matching discipline found for: ${education.major}`);
                }
            } else {
                console.warn(`[EZ-Apply] Discipline select not found for index ${idx}`);
            }
            
            // Set dates
            if (schoolName && schoolName.parentNode && schoolName.parentNode.parentNode) {
                const parent = schoolName.parentNode.parentNode;
                const startDate = parent.getElementsByClassName("start-date-year")[0];
                const endDate = parent.getElementsByClassName("end-date-year")[0];
                
                if (startDate && education.startdate) {
                    startDate.value = education.startdate.substring(0, startDate.maxLength);
                    startDate.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                }
                
                if (endDate && education.enddate) {
                    endDate.value = education.enddate.substring(0, endDate.maxLength);
                    endDate.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                }
            } else {
                console.warn('[EZ-Apply] Could not find date fields');
            }
            
            console.log(`[EZ-Apply] Education at index ${idx} filled successfully`);
        } catch (error) {
            console.error(`[EZ-Apply] Error filling education at index ${idx}:`, error);
        }
    }

    fill_experience_greenhouse(experience, idx){
        if(idx != 0){
            document.getElementById("add_experience").click();
        }
        var company_name = document.getElementById("experience_company_name_" + idx);
        var title = document.getElementById("experience_title_" + idx);
        var titleUpdate = document.getElementById("s2id_experience_title_" + idx);
        for(var i = 0; i < title.options.length; i++){
            if(title.options[i].value != ""){
                if(title.options[i].text.toLowerCase().includes(experience['title'].toLowerCase())){
                    title.options[i].selected = true;
                    title.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    titleUpdate.getElementsByClassName("select2-chosen")[0].innerText = title.options[i].text;
                    titleUpdate.getElementsByClassName("select2-chosen")[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    break;
                }
            }
        }
        var parent = company_name.parentNode.parentNode;
        var start_date = parent.getElementsByClassName("start-date-year")[0];
        var end_date = parent.getElementsByClassName("end-date-year")[0];
        start_date.value = experience['startdate'].substring(0, start_date.maxLength);
        start_date.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        end_date.value = experience['enddate'].substring(0, end_date.maxLength);
        end_date.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
    }

    check_fill_experience() {
        for(var i = 0; i < this.resume_json['experiences'].length; i++){
            var experience = this.resume_json['experiences'][i];
            switch(this.job_portal_type){
                case CompanyType.greenhouse:
                    this.fill_experience_greenhouse(experience, i);
                    break;
            }
        }
    }

    check_fill_education() {
        console.log('[EZ-Apply] Checking and filling education information');
        
        // First, check if educations exists in resume_json
        if (!this.resume_json.educations || !Array.isArray(this.resume_json.educations)) {
            console.warn('[EZ-Apply] No education data found in resume');
            return;
        }
        
        console.log(`[EZ-Apply] Processing ${this.resume_json.educations.length} education entries`);
        
        for(var i = 0; i < this.resume_json.educations.length; i++){
            try {
                var education = this.resume_json.educations[i];
                
                switch(this.job_portal_type){
                    case CompanyType.greenhouse:
                        console.log(`[EZ-Apply] Filling education ${i+1} for Greenhouse portal`);
                        this.fill_education_greenhouse(education, i);
                        break;
                    default:
                        console.warn(`[EZ-Apply] No education fill method for portal type: ${this.job_portal_type}`);
                }
            } catch (error) {
                console.error(`[EZ-Apply] Error filling education entry ${i}:`, error);
            }
        }
    }

    upload_greenhouse() {
        console.log('[EZ-Apply] Attempting to upload resume to Greenhouse');
        
        // Upload resume
        if (this.resume_file !== null) {
            var resumeForm = document.getElementById("s3_upload_for_resume");
            if (resumeForm) {
                try {
                    var fileInput = resumeForm.querySelector("input[type='file']");
                    if (fileInput) {
                        console.log('[EZ-Apply] Found resume file input in Greenhouse form');
                        fileInput.files = this.resume_file.files;
                        fileInput.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        console.log('[EZ-Apply] Resume uploaded successfully');
                    } else {
                        console.error('[EZ-Apply] Could not find file input in resume form');
                    }
                } catch (error) {
                    console.error('[EZ-Apply] Error uploading resume:', error);
                }
            } else {
                console.warn('[EZ-Apply] Resume upload form not found. This may not be a Greenhouse application page.');
            }
        }

        // Upload cover letter
        if (this.cover_letter !== null) {
            var coverLetterForm = document.getElementById("s3_upload_for_cover_letter");
            if (coverLetterForm) {
                try {
                    var fileInput = coverLetterForm.querySelector("input[type='file']");
                    if (fileInput) {
                        console.log('[EZ-Apply] Found cover letter file input in Greenhouse form');
                        fileInput.files = this.cover_letter.files;
                        fileInput.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        console.log('[EZ-Apply] Cover letter uploaded successfully');
                    } else {
                        console.error('[EZ-Apply] Could not find file input in cover letter form');
                    }
                } catch (error) {
                    console.error('[EZ-Apply] Error uploading cover letter:', error);
                }
            } else {
                console.warn('[EZ-Apply] Cover letter upload form not found. This may not be a Greenhouse application page.');
            }
        }
    }

    upload_lever() {
        console.log('[EZ-Apply] Attempting to upload files to Lever');
        
        // Check if this.form exists
        if (!this.form) {
            console.error('[EZ-Apply] No form found for Lever application');
            return;
        }
        
        try {
            let resumeUploaded = false;
            let coverLetterUploaded = false;
            
            Array.from(this.form.elements).forEach(element => {
                try {
                    // Upload resume
                    if (element.type == "file" && element.name == "resume" && this.resume_file !== null) {
                        console.log('[EZ-Apply] Found resume file input in Lever form');
                        element.files = this.resume_file.files;
                        element.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        console.log('[EZ-Apply] Resume uploaded successfully to Lever');
                        resumeUploaded = true;
                    }
                    
                    // Upload cover letter
                    if (element.type == "file" && element.name == "coverLetter" && this.cover_letter !== null) {
                        console.log('[EZ-Apply] Found cover letter file input in Lever form');
                        element.files = this.cover_letter.files;
                        element.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        console.log('[EZ-Apply] Cover letter uploaded successfully to Lever');
                        coverLetterUploaded = true;
                    }
                } catch (elementError) {
                    console.error('[EZ-Apply] Error processing form element:', elementError);
                }
            });
            
            if (this.resume_file !== null && !resumeUploaded) {
                console.warn('[EZ-Apply] Resume file input not found in Lever form');
            }
            
            if (this.cover_letter !== null && !coverLetterUploaded) {
                console.warn('[EZ-Apply] Cover letter file input not found in Lever form');
            }
        } catch (error) {
            console.error('[EZ-Apply] Error in upload_lever:', error);
        }
    }

    upload_googleforms() {
        console.log('[EZ-Apply] Attempting to upload files to Google Forms');
        
        if (!this.form) {
            console.error('[EZ-Apply] No form found for Google Forms application');
            return;
        }
        
        try {
            // First, find all question texts on the page
            const questionElements = document.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseTitle, .freebirdFormviewerViewItemsItemItemTitle');
            const questions = [];
            
            questionElements.forEach(element => {
                questions.push({
                    text: element.textContent.trim().toLowerCase(),
                    element: element
                });
            });
            
            console.log(`[EZ-Apply] Found ${questions.length} questions in the Google Form`);
            
            // Map common question patterns to resume fields
            const questionMappings = [
                { patterns: ['email', 'e-mail', 'e mail'], field: 'email' },
                { patterns: ['first name', 'firstname', 'given name'], field: 'first name' },
                { patterns: ['last name', 'lastname', 'family name', 'surname'], field: 'last name' },
                { patterns: ['full name', 'name'], field: 'name' },
                { patterns: ['phone', 'mobile', 'cell'], field: 'phone' },
                { patterns: ['address', 'location', 'where are you', 'where do you live'], field: 'address' },
                { patterns: ['city'], field: 'city' },
                { patterns: ['state', 'province'], field: 'state' },
                { patterns: ['zip', 'postal', 'pin code'], field: 'zip' },
                { patterns: ['linkedin', 'linked in'], field: 'linkedin' },
                { patterns: ['github', 'git hub'], field: 'github' },
                { patterns: ['website', 'web site', 'personal site'], field: 'website' },
                { patterns: ['university', 'college', 'school'], field: 'school' },
                { patterns: ['major', 'degree', 'study'], field: 'major' },
                { patterns: ['company', 'work', 'employer'], field: 'company' },
                { patterns: ['job title', 'position', 'role'], field: 'title' }
            ];
            
            // Process text fields
            const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
            console.log(`[EZ-Apply] Found ${textInputs.length} text input fields`);
            
            textInputs.forEach((input, index) => {
                try {
                    // Find the closest question element
                    const closestQuestion = this.findNearestQuestion(input, questions);
                    
                    if (!closestQuestion) {
                        console.warn(`[EZ-Apply] Could not find question for field ${index+1}`);
                        return;
                    }
                    
                    const questionText = closestQuestion.text;
                    console.log(`[EZ-Apply] Field ${index+1} question: "${questionText}"`);
                    
                    // Check if we have a mapping for this question
                    let fieldValue = null;
                    
                    // First try to find a direct match from our mapping
                    for (const mapping of questionMappings) {
                        if (mapping.patterns.some(pattern => questionText.includes(pattern))) {
                            if (this.resume_json[mapping.field]) {
                                fieldValue = this.resume_json[mapping.field];
                                console.log(`[EZ-Apply] Mapped "${questionText}" to resume field "${mapping.field}"`);
                                break;
                            }
                        }
                    }
                    
                    // If no mapping found, try to match with any field in resume_json
                    if (!fieldValue) {
                        for (const key in this.resume_json) {
                            if (questionText.includes(key.toLowerCase())) {
                                fieldValue = this.resume_json[key];
                                console.log(`[EZ-Apply] Matched "${questionText}" directly to "${key}"`);
                                break;
                            }
                        }
                    }
                    
                    // Special case for education
                    if (!fieldValue && 
                        (questionText.includes('university') || 
                         questionText.includes('school') || 
                         questionText.includes('college'))) {
                        if (this.resume_json.educations && this.resume_json.educations.length > 0) {
                            fieldValue = this.resume_json.educations[0].school;
                            console.log(`[EZ-Apply] Using education school name: ${fieldValue}`);
                        }
                    }
                    
                    // Special case for major/degree
                    if (!fieldValue && 
                        (questionText.includes('major') || 
                         questionText.includes('study') || 
                         questionText.includes('degree'))) {
                        if (this.resume_json.educations && this.resume_json.educations.length > 0) {
                            fieldValue = this.resume_json.educations[0].major;
                            console.log(`[EZ-Apply] Using education major: ${fieldValue}`);
                        }
                    }
                    
                    // Special case for work experience
                    if (!fieldValue && 
                        (questionText.includes('company') || 
                         questionText.includes('work') || 
                         questionText.includes('employer'))) {
                        if (this.resume_json.experiences && this.resume_json.experiences.length > 0) {
                            fieldValue = this.resume_json.experiences[0].company;
                            console.log(`[EZ-Apply] Using work company: ${fieldValue}`);
                        }
                    }
                    
                    // Fill the field if we found a value
                    if (fieldValue) {
                        input.value = fieldValue;
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log(`[EZ-Apply] Filled field with: ${fieldValue}`);
                    } else {
                        console.log(`[EZ-Apply] No matching data found for question: "${questionText}"`);
                    }
                } catch (error) {
                    console.error(`[EZ-Apply] Error filling text field ${index+1}:`, error);
                }
            });
            
            // Process radio and checkbox fields
            const radioInputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            const radioGroups = {};
            
            // Group radio buttons by name
            radioInputs.forEach(radio => {
                const name = radio.name;
                if (!radioGroups[name]) {
                    radioGroups[name] = [];
                }
                radioGroups[name].push(radio);
            });
            
            // Process each radio group
            for (const [name, radios] of Object.entries(radioGroups)) {
                try {
                    // Find the closest question for this radio group
                    const closestQuestion = this.findNearestQuestion(radios[0], questions);
                    if (!closestQuestion) {
                        console.warn(`[EZ-Apply] Could not find question for radio group ${name}`);
                        continue;
                    }
                    
                    const questionText = closestQuestion.text;
                    console.log(`[EZ-Apply] Radio group ${name} question: "${questionText}"`);
                    
                    // Special handling for education level question
                    if (questionText.includes('education') || questionText.includes('degree')) {
                        if (this.resume_json.educations && this.resume_json.educations.length > 0) {
                            const degree = this.resume_json.educations[0].degreetype.toLowerCase();
                            
                            // Try to find a matching option
                            let matched = false;
                            for (const radio of radios) {
                                const optionText = this.getRadioLabelText(radio).toLowerCase();
                                if (optionText.includes(degree) || 
                                    (degree.includes('bachelor') && optionText.includes('bachelor')) ||
                                    (degree.includes('master') && optionText.includes('master')) ||
                                    (degree.includes('phd') && optionText.includes('phd')) ||
                                    (degree.includes('doctor') && optionText.includes('phd'))) {
                                    radio.checked = true;
                                    radio.click();
                                    radio.dispatchEvent(new Event("change", { bubbles: true }));
                                    console.log(`[EZ-Apply] Selected education option: ${optionText}`);
                                    matched = true;
                                    break;
                                }
                            }
                            
                            if (!matched) {
                                console.warn(`[EZ-Apply] Could not find matching option for degree: ${degree}`);
                            }
                        }
                    }
                    // Special handling for work location/office question
                    else if (questionText.includes('office') || questionText.includes('remote') || 
                             questionText.includes('work from')) {
                        const preferOffice = true; // You can customize this based on preferences
                        
                        for (const radio of radios) {
                            const optionText = this.getRadioLabelText(radio).toLowerCase();
                            
                            // Look for yes/no options
                            if ((preferOffice && optionText === 'yes') || 
                                (!preferOffice && optionText === 'no')) {
                                radio.checked = true;
                                radio.click();
                                radio.dispatchEvent(new Event("change", { bubbles: true }));
                                console.log(`[EZ-Apply] Selected work location option: ${optionText}`);
                                break;
                            }
                        }
                    }
                    // General radio option selection
                    else {
                        // Try to select the appropriate option
                        for (const radio of radios) {
                            const optionText = this.getRadioLabelText(radio).toLowerCase();
                            const selected = this.should_select_option(questionText, optionText);
                            
                            if (selected) {
                                console.log(`[EZ-Apply] Selected option: ${optionText}`);
                                radio.checked = true;
                                radio.click();
                                radio.dispatchEvent(new Event("change", { bubbles: true }));
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`[EZ-Apply] Error processing radio group ${name}:`, error);
                }
            }
            
            // Handle date fields
            const dateInputs = document.querySelectorAll('input[type="date"]');
            dateInputs.forEach((input, index) => {
                try {
                    const closestQuestion = this.findNearestQuestion(input, questions);
                    if (!closestQuestion) return;
                    
                    const questionText = closestQuestion.text.toLowerCase();
                    
                    // Set a start date based on question text
                    if (questionText.includes('start')) {
                        const startDate = new Date();
                        startDate.setDate(startDate.getDate() + 14); // Start in 2 weeks by default
                        input.value = startDate.toISOString().split('T')[0];
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log(`[EZ-Apply] Set start date to: ${input.value}`);
                    }
                } catch (error) {
                    console.error(`[EZ-Apply] Error processing date field ${index+1}:`, error);
                }
            });
            
            // Upload files
            this.upload_googleforms();
            
            console.log('[EZ-Apply] Google Forms filling completed');
        } catch (error) {
            console.error('[EZ-Apply] Error filling Google Forms:', error);
        }
    }

    // Find the nearest question for a form element
    findNearestQuestion(element, questions) {
        // Try to find the containing form section
        let current = element;
        const maxAttempts = 10;
        let attempts = 0;
        
        while (current && attempts < maxAttempts) {
            attempts++;
            // Look for Google Forms question container
            if (current.classList && 
                (current.classList.contains('freebirdFormviewerViewItemsItemItem') || 
                 current.classList.contains('freebirdFormviewerComponentsQuestionBaseRoot'))) {
                
                // Find the question title within this container
                const titleElement = current.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle, .freebirdFormviewerViewItemsItemItemTitle');
                
                if (titleElement) {
                    return {
                        text: titleElement.textContent.trim().toLowerCase(),
                        element: titleElement
                    };
                }
                
                break;
            }
            
            current = current.parentNode;
        }
        
        // If we couldn't find it using DOM hierarchy, use the closest question by position
        if (questions.length === 0) {
            return null;
        }
        
        // Get the element's position
        const rect = element.getBoundingClientRect();
        
        // Find the question that's vertically closest but above the element
        let closestQuestion = null;
        let minDistance = Infinity;
        
        for (const question of questions) {
            const questionRect = question.element.getBoundingClientRect();
            // Only consider questions that are above the element
            if (questionRect.bottom < rect.top) {
                const distance = rect.top - questionRect.bottom;
                if (distance < minDistance) {
                    minDistance = distance;
                    closestQuestion = question;
                }
            }
        }
        
        return closestQuestion;
    }

    upload_general() {
        console.log('[EZ-Apply] Attempting to upload files to general website');
        
        try {
            // Find all file upload elements on the page
            const fileInputs = document.querySelectorAll('input[type="file"]');
            console.log(`[EZ-Apply] Found ${fileInputs.length} file inputs on page`);
            
            if (fileInputs.length === 0) {
                console.warn('[EZ-Apply] No file upload fields found on this page');
                return;
            }
            
            let resumeUploaded = false;
            let coverLetterUploaded = false;
            
            // Try to upload resume and cover letter to appropriate fields
            fileInputs.forEach((input, index) => {
                try {
                    // Try to determine purpose of file input by name, id, or surrounding text
                    const inputName = (input.name || '').toLowerCase();
                    const inputId = (input.id || '').toLowerCase();
                    const parentDiv = this.findParentWithText(input);
                    const labelText = parentDiv ? parentDiv.innerText.toLowerCase() : '';
                    
                    const acceptAttr = (input.getAttribute('accept') || '').toLowerCase();
                    const isPdfOnly = acceptAttr.includes('pdf');
                    
                    // Check for resume-related keywords
                    if (!resumeUploaded && this.resume_file !== null && 
                        (inputName.includes('resume') || inputId.includes('resume') || 
                         labelText.includes('resume') || labelText.includes('cv') || 
                         (isPdfOnly && index === 0))) {
                        console.log(`[EZ-Apply] Uploading resume to field ${index+1}`);
                        input.files = this.resume_file.files;
                        input.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        resumeUploaded = true;
                    }
                    // Check for cover letter keywords
                    else if (!coverLetterUploaded && this.cover_letter !== null && 
                        (inputName.includes('cover') || inputId.includes('cover') || inputName.includes('letter') || 
                         inputId.includes('letter') || labelText.includes('cover') || 
                         labelText.includes('letter') || (isPdfOnly && index === 1))) {
                        console.log(`[EZ-Apply] Uploading cover letter to field ${index+1}`);
                        input.files = this.cover_letter.files;
                        input.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        coverLetterUploaded = true;
                    }
                } catch (error) {
                    console.error(`[EZ-Apply] Error processing file input ${index+1}:`, error);
                }
            });
            
            if (this.resume_file !== null && !resumeUploaded) {
                console.warn('[EZ-Apply] Could not find appropriate field for resume upload');
            }
            
            if (this.cover_letter !== null && !coverLetterUploaded) {
                console.warn('[EZ-Apply] Could not find appropriate field for cover letter upload');
            }
        } catch (error) {
            console.error('[EZ-Apply] Error in upload_general:', error);
        }
    }

    // Helper method to find parent element with text content
    findParentWithText(element, maxLevels = 5) {
        let current = element;
        let level = 0;
        
        while (current && level < maxLevels) {
            if (current.innerText && current.innerText.trim().length > 0) {
                return current;
            }
            current = current.parentNode;
            level++;
        }
        
        return null;
    }

    // General website form filling
    fill_general_website() {
        console.log('[EZ-Apply] Filling general website form fields');
        
        try {
            // Process all input fields
            const inputs = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');
            console.log(`[EZ-Apply] Found ${inputs.length} input fields`);
            
            inputs.forEach((input, index) => {
                try {
                    const type = input.type || 'text';
                    const name = (input.name || '').toLowerCase();
                    const id = (input.id || '').toLowerCase();
                    const placeholder = (input.placeholder || '').toLowerCase();
                    
                    // Create a combined text to search for field purpose
                    let fieldHint = name + ' ' + id + ' ' + placeholder;
                    
                    // Try to find an associated label
                    const label = this.findLabelForInput(input);
                    if (label) {
                        fieldHint += ' ' + label.innerText.toLowerCase();
                    }
                    
                    console.log(`[EZ-Apply] Field ${index+1} type: ${type}, hint: ${fieldHint.substring(0, 50)}...`);
                    
                    if (type === 'text' || type === 'email' || type === 'textarea' || type === 'tel') {
                        this.fill_text_field(input, fieldHint);
                    } else if (type === 'radio' || type === 'checkbox') {
                        this.fill_select_field(input, fieldHint);
                    } else if (type === 'select-one' || type === 'select-multiple') {
                        this.fill_select_field(input, fieldHint);
                    }
                } catch (error) {
                    console.error(`[EZ-Apply] Error filling field ${index+1}:`, error);
                }
            });
            
            // Upload files
            this.upload_general();
            
            console.log('[EZ-Apply] General website form filling completed');
        } catch (error) {
            console.error('[EZ-Apply] Error filling general website form:', error);
        }
    }

    // Helper method to find label with text for an input
    findParentWithLabel(element, maxLevels = 5) {
        // First try to find a direct label
        if (element.id) {
            const directLabel = document.querySelector(`label[for="${element.id}"]`);
            if (directLabel) {
                return directLabel;
            }
        }
        
        // Then try parent elements
        return this.findParentWithText(element, maxLevels);
    }

    // Helper method to find a label element for an input
    findLabelForInput(input) {
        // Check for a label with 'for' attribute
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                return label;
            }
        }
        
        // Check if input is inside a label
        let parent = input.parentNode;
        while (parent) {
            if (parent.tagName && parent.tagName.toLowerCase() === 'label') {
                return parent;
            }
            parent = parent.parentNode;
        }
        
        return null;
    }

    // Helper method to get radio button label text
    getRadioLabelText(radio) {
        // Check for a label with 'for' attribute
        if (radio.id) {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (label) {
                return label.innerText;
            }
        }
        
        // Check for nearby text node
        const parent = radio.parentNode;
        if (parent) {
            // Remove any other input elements' text
            const clone = parent.cloneNode(true);
            const inputs = clone.querySelectorAll('input');
            inputs.forEach(input => input.remove());
            
            return clone.innerText.trim();
        }
        
        return '';
    }

    // Determine if an option should be selected based on resume data
    should_select_option(questionText, optionText) {
        // Simple matching for yes/no and common options
        questionText = questionText.toLowerCase();
        optionText = optionText.toLowerCase();
        
        // Check if it's a yes/no question about skills/experience that we have
        const positiveKeywords = ['experience', 'skill', 'knowledge', 'familiar', 'able to', 'can you'];
        const isPositiveQuestion = positiveKeywords.some(keyword => questionText.includes(keyword));
        
        if ((optionText === 'yes' || optionText === 'true') && isPositiveQuestion) {
            return true;
        }
        
        // For gender selection
        if (this.resume_json.gender && questionText.includes('gender')) {
            if (this.resume_json.gender.toLowerCase() === optionText) {
                return true;
            }
        }
        
        // For work authorization
        if (questionText.includes('authorized') || questionText.includes('legally') || questionText.includes('eligible')) {
            if (this.resume_json.work_authorization && 
                this.resume_json.work_authorization.toLowerCase().includes('authorized') && 
                (optionText === 'yes' || optionText === 'true')) {
                return true;
            }
        }
        
        // For education level
        const educationLevels = ['high school', 'bachelor', 'master', 'phd', 'doctorate'];
        if (questionText.includes('education') || questionText.includes('degree')) {
            // Check for education in resume
            if (this.resume_json.educations && this.resume_json.educations.length > 0) {
                for (const education of this.resume_json.educations) {
                    if (education.degreetype && optionText.includes(education.degreetype.toLowerCase())) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}

// Add debug logging for initialization
console.log('[EZ-Apply] Autofill script loaded');

// Add message listener for communication from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('[EZ-Apply] Message received in content script:', request);
    
    if (request.action === "autofill") {
        console.log('[EZ-Apply] Autofill action triggered via message');
        try {
            if (typeof autofill_manager !== 'undefined' && autofill_manager !== null) {
                console.log('[EZ-Apply] Using autofill_manager');
                
                // Check if all necessary components are available
                if (!autofill_manager.userData || !autofill_manager.userData.resume_json) {
                    console.error('[EZ-Apply] User data not available');
                    sendResponse({status: "error", message: "User data not available"});
                    return true;
                }
                
                // Trigger the autofill
                autofill_manager.change();
                sendResponse({status: "success", message: "Autofill triggered"});
            } else {
                console.error('[EZ-Apply] autofill_manager not found');
                sendResponse({status: "error", message: "autofill_manager not found"});
            }
        } catch (error) {
            console.error('[EZ-Apply] Error during autofill:', error);
            sendResponse({status: "error", message: error.message});
        }
    }
    
    return true;  // Keep the message channel open for asynchronous response
});