(function() {
    if (window.hasRunContentScript) {
        return;
    }
    window.hasRunContentScript = true;

    const inputs = document.querySelectorAll('input, textarea, select');
    const fields = new Map();

    inputs.forEach((input) => {
        const fieldData = {
            name: input.name || '',
            id: input.id || '',
            placeholder: input.placeholder || '',
            label: '',
            ariaLabel: input.getAttribute('aria-label') || '',
            surroundingText: '',
            type: input.type || ''
        };

       let labelText = '';
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                labelText = label.innerText.trim();
            }
        }
        if (!labelText && input.name) {
            let parent = input.parentElement;
            while (parent && parent !== document.body) {
                const label = parent.querySelector('label');
                if (label) {
                    labelText = label.innerText.trim();
                    break;
                }
                parent = parent.parentElement;
            }
        }
        fieldData.label = labelText;

        if (!labelText) {
            let parent = input.parentElement;
            while (parent && parent !== document.body) {
                const texts = Array.from(parent.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(text => text);
                if (texts.length > 0) {
                    fieldData.surroundingText = texts.join(' ');
                    break;
                }
                parent = parent.parentElement;
            }
        }

        const uniqueKey = fieldData.name || fieldData.id || fieldData.label || fieldData.placeholder || fieldData.ariaLabel || fieldData.surroundingText;

        if (uniqueKey && !fields.has(uniqueKey)) {
            fields.set(uniqueKey, fieldData);
        }
    });

    const fieldArray = Array.from(fields.values());

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'collectFormData') {
            const formData = collectCurrentFormData();
            sendResponse({ status: 'success', data: formData });
        } else if (message.action === 'restoreFormData') {
            const formData = message.data;
            restoreFormFields(formData);
            sendResponse({ status: 'success' });
        }
    });

    function collectCurrentFormData() {
        const inputs = document.querySelectorAll('input, textarea, select');
        const formData = {};

        inputs.forEach((input) => {
            const nameOrId = input.name || input.id;
            if (nameOrId) {
                formData[nameOrId] = input.value;
            }
        });

        return formData;
    }

    function restoreFormFields(formData) {
        const formElements = document.querySelectorAll('input, select, textarea');
    
        formElements.forEach((element) => {
            if (element.name && formData[element.name] !== undefined) {
                element.value = formData[element.name];
            }
        });
    }
    

    chrome.runtime.sendMessage({ action: 'formFieldsData', fields: fieldArray });

})();
