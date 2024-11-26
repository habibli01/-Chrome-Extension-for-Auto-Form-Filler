(function() {
    // Collect all input, textarea, and select elements
    const inputs = document.querySelectorAll('input, textarea, select');
    const fields = new Set(); 

    inputs.forEach((input) => {
        const name = input.name || input.id || '';
        if (name) {
            fields.add(name);
        }
    });

    const fieldArray = Array.from(fields);

    chrome.runtime.sendMessage({ action: 'formFields', fields: fieldArray });
})();
