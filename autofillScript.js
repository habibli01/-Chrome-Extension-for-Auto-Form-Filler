(function() {
    chrome.storage.local.get(['formFieldMappings', 'profiles', 'activeProfile'], (data) => {
        const mappings = data.formFieldMappings || {};
        const profiles = data.profiles || {};
        const activeProfile = data.activeProfile;
        const profileData = profiles[activeProfile] || {};

        // Filling the form fields
        for (const [formField, profileField] of Object.entries(mappings)) {
            const value = profileData[profileField];
            if (value !== undefined) {
                const input = document.querySelector(`[name="${formField}"], [id="${formField}"]`);
                if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    });
})();
