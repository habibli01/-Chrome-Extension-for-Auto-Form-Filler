(function() {
    console.log('formListener.js is running.');
    if (window.hasRunFormListener) return;
    window.hasRunFormListener = true;

    function extractJobApplicationData() {
        const dateApplied = new Date().toISOString().split('T')[0];

        const jobTitle = getJobTitleFromPage();
        const company = getCompanyNameFromPage();

        if (jobTitle || company) {
            return {
                company: company || 'Unknown Company',
                jobTitle: jobTitle || 'Unknown Position',
                dateApplied: dateApplied,
                status: 'Applied'
            };
        } else {
            return null;
        }
    }

    function getJobTitleFromPage() {
        let jobTitle = '';

        const selectors = [
            '#jobTitle', 
            'h1.job-title',
            'h1.title',
            'h1',
            'div.job-title',
            'div.title',
            'span.job-title',
            'meta[property="og:title"]',
            'title'
        ];

        for (const selector of selectors) {
            let element = document.querySelector(selector);
            if (element) {
                if (selector === 'meta[property="og:title"]') {
                    jobTitle = element.getAttribute('content');
                } else if (selector === 'title') {
                    jobTitle = document.title;
                } else {
                    jobTitle = element.innerText.trim();
                }
                if (jobTitle) break;
            }
        }

        if (jobTitle) {
            console.log('Extracted job application data:', jobTitle);
            jobTitle = jobTitle.split(' at ')[0].trim();
        }

        return jobTitle;
    }

    function getCompanyNameFromPage() {
        let company = '';

        const selectors = [
            '#companyName',
            'h2.company-name',
            'div.company-name',
            'span.company-name',
            'meta[property="og:site_name"]',
            'meta[name="author"]'
        ];

        for (const selector of selectors) {
            let element;
            if (selector.startsWith('meta')) {
                element = document.querySelector(selector);
                if (element) {
                    company = element.getAttribute('content');
                }
            } else {
                element = document.querySelector(selector);
                if (element) {
                    company = element.innerText.trim();
                }
            }
            if (company) break;
        }

        if (!company) {
            const jobTitle = getJobTitleFromPage();
            
            if (jobTitle.includes(' at ')) {
                company = jobTitle.split(' at ')[1].trim();
            }
        }
        console.log('Extracted company data:', company);
        return company;
    }

    document.addEventListener('submit', function(event) {
        const form = event.target;

        setTimeout(() => {
            const jobApplication = extractJobApplicationData();

            if (jobApplication) {
                
                chrome.runtime.sendMessage({ action: 'saveJobApplication', data: jobApplication });
            }
        }, 0);
    }, true); 
})();
