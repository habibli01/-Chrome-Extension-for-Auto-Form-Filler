
const profileSelector = document.getElementById("profileSelector");
const createProfileButton = document.getElementById("createProfileButton");
const deleteProfileButton = document.getElementById("deleteProfileButton");
const customFieldsContainer = document.getElementById("customFieldsContainer");
const addFieldButton = document.getElementById("addFieldButton");
const fieldNameInput = document.getElementById("fieldName");
const fieldValueInput = document.getElementById("fieldValue");
const fetchDataButton = document.getElementById("fetch-data");
const saveButton = document.getElementById("save-button");
const linkedinUrlInput = document.getElementById("linkedin-url");
const exportDataButton = document.getElementById("exportDataButton");
const importDataButton = document.getElementById("importDataButton");
const importFileInput = document.getElementById("importFileInput");
const mappingInterface = document.getElementById('mappingInterface');
const mappingContainer = document.getElementById('mappingContainer');
const saveMappingButton = document.getElementById('saveMappingButton');
const mapFieldsButton = document.getElementById('mapFieldsButton');
const autofillButton = document.getElementById('autofillButton');
const sendEmailButton = document.getElementById('sendEmailButton');
const saveFormDataButton = document.getElementById('saveFormDataButton');
const savedFormsContainer = document.getElementById('savedFormsContainer');
const applicationsContainer = document.getElementById('applicationsContainer');

document.addEventListener("DOMContentLoaded", () => {
    loadProfiles();
    mapFieldsButton.addEventListener('click', () => {
        const autoModeCheckbox = document.getElementById('autoModeCheckbox');
        const autoMode = autoModeCheckbox.checked;
        initiateFieldMapping(autoMode);
    });
    saveMappingButton.addEventListener('click', saveFieldMappings);
    autofillButton.addEventListener('click', injectAutofillScript);
    sendEmailButton.addEventListener('click', sendDataViaEmail);

    saveFormDataButton.addEventListener('click', saveCurrentFormData);

 
    loadApplications();
});


function loadProfiles() {
    chrome.storage.local.get(["profiles", "activeProfile"], (data) => {
        const profiles = data.profiles || {};
        const activeProfile = data.activeProfile || null;

        profileSelector.innerHTML = "";
        for (const profileName of Object.keys(profiles)) {
            const option = document.createElement("option");
            option.value = profileName;
            option.textContent = profileName;
            if (profileName === activeProfile) {
                option.selected = true;
            }
            profileSelector.appendChild(option);
        }

        if (activeProfile && profiles[activeProfile]) {
            loadCustomFields(profiles[activeProfile]);
            loadSavedForms();
        } else {
            customFieldsContainer.innerHTML = ""; 
            savedFormsContainer.innerHTML = "";
        }
    });
}

function saveFieldMappings() {
    const selects = mappingContainer.querySelectorAll('select');
    const mappings = {};

    selects.forEach((select) => {
        const formField = select.name;
        const profileField = select.value;
        if (profileField) {
            mappings[formField] = profileField;
        }
    });

    chrome.storage.local.set({ formFieldMappings: mappings }, () => {
        alert('Mappings saved successfully!');
        mappingInterface.style.display = 'none';
    });
}
function restoreFormData(formData) {
    injectContentScript(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'restoreFormData', data: formData }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    alert("Failed to restore form data.");
                    return;
                }

                if (response && response.status === 'success') {
                    alert("Form data restored successfully!");
                } else {
                    alert("Failed to restore form data.");
                }
            });
        });
    });
}

function deleteSavedForm(formName) {
    if (!confirm(`Are you sure you want to delete the saved form "${formName}"?`)) {
        return;
    }

    chrome.storage.local.get(['profiles', 'activeProfile'], (data) => {
        const profiles = data.profiles || {};
        const activeProfile = data.activeProfile;
        if (!activeProfile || !profiles[activeProfile]) {
            alert("No active profile selected.");
            return;
        }

        const profile = profiles[activeProfile];
        if (profile.savedForms && profile.savedForms[formName]) {
            delete profile.savedForms[formName];
            profiles[activeProfile] = profile;
            chrome.storage.local.set({ profiles }, () => {
                alert("Saved form deleted.");
                loadSavedForms(); 
            });
        }
    });
}


function loadSavedForms() {
    savedFormsContainer.innerHTML = ''; 

    chrome.storage.local.get(['profiles', 'activeProfile'], (data) => {
        const profiles = data.profiles || {};
        const activeProfile = data.activeProfile;
        if (!activeProfile || !profiles[activeProfile]) {
            savedFormsContainer.textContent = "No active profile or saved forms.";
            return;
        }

        const profile = profiles[activeProfile];
        const savedForms = profile.savedForms || {};

        if (Object.keys(savedForms).length === 0) {
            savedFormsContainer.textContent = "No saved forms.";
            return;
        }

        for (const [formName, formData] of Object.entries(savedForms)) {
            const formDiv = document.createElement('div');
            formDiv.className = 'saved-form-item';

            const label = document.createElement('span');
            label.textContent = formName;

            const restoreButton = document.createElement('button');
            restoreButton.textContent = 'Restore';
            restoreButton.setAttribute('type', 'button');
            restoreButton.addEventListener('click', () => {
                restoreFormData(formData);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.setAttribute('type', 'button');
            deleteButton.addEventListener('click', () => {
                deleteSavedForm(formName);
            });

            formDiv.appendChild(label);
            formDiv.appendChild(restoreButton);
            formDiv.appendChild(deleteButton);
            savedFormsContainer.appendChild(formDiv);
        }
    });
}


function saveCurrentFormData() {
    const formName = prompt("Enter a name for this form data:");
    if (!formName) {
        alert("Form data not saved. Name is required.");
        return;
    }

    injectContentScript(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'collectFormData' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    alert("Failed to collect form data.");
                    return;
                }

                if (response && response.status === 'success') {
                    const formData = response.data;
                    chrome.storage.local.get(['profiles', 'activeProfile'], (data) => {
                        const profiles = data.profiles || {};
                        const activeProfile = data.activeProfile;
                        if (!activeProfile) {
                            alert("No active profile selected.");
                            return;
                        }
                        const profile = profiles[activeProfile] || {};

                        profile.savedForms = profile.savedForms || {};
                        profile.savedForms[formName] = formData;

                        profiles[activeProfile] = profile;
                        chrome.storage.local.set({ profiles }, () => {
                            alert("Form data saved successfully!");
                            loadSavedForms(); 
                        });
                    });
                } else {
                    alert("Failed to collect data.");
                }
            });
        });
    });
}


function initiateFieldMapping(autoMode) {
    injectContentScript(() => {

    });
}

function injectContentScript(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript(
            {
                target: { tabId: activeTab.id },
                files: ['contentScript.js']
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    alert('Failed to inject content script.');
                } else {
                   callback();
                }
            }
        );
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'formFieldsData') {
        const formFields = message.fields;
        const autoModeCheckbox = document.getElementById('autoModeCheckbox');
        const autoMode = autoModeCheckbox.checked;
        displayMappingInterface(formFields, autoMode);
    }
});
function displayMappingInterface(formFields, autoMode = false) {
    mappingContainer.innerHTML = ''; 
    chrome.storage.local.get(['profiles', 'activeProfile', 'formFieldMappings'], (data) => {
        const profiles = data.profiles || {};
        const activeProfile = data.activeProfile;
        const profileFields = profiles[activeProfile] ? Object.keys(profiles[activeProfile]) : [];
        const savedMappings = data.formFieldMappings || {};

        let mappings = {};

        if (autoMode) {
            mappings = autoMapFields(formFields, profileFields);
        } else {
            mappings = savedMappings;
        }

        formFields.forEach((field) => {
            const div = document.createElement('div');
            div.className = 'mapping-item';

            const label = document.createElement('label');
            const fieldLabel = field.name || field.id || field.label || field.placeholder || field.ariaLabel || field.surroundingText || 'Unknown';
            label.textContent = `Form Field: ${fieldLabel}`;

            const select = document.createElement('select');
            const uniqueKey = field.name || field.id || field.label || field.placeholder || field.ariaLabel || field.surroundingText ;
            select.name = uniqueKey;

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Do not map';
            select.appendChild(defaultOption);

            profileFields.forEach((profileField) => {
                const option = document.createElement('option');
                option.value = profileField;
                option.textContent = profileField;

                if (mappings[uniqueKey] === profileField) {
                    option.selected = true;
                }

                select.appendChild(option);
            });

            div.appendChild(label);
            div.appendChild(select);
            mappingContainer.appendChild(div);
        });

        mappingInterface.style.display = 'block';
    });
}


function injectAutofillScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript(
            {
                target: { tabId: activeTab.id },
                files: ['autofillScript.js']
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                } else {
                    alert('Form autofilled successfully!');
                }
            }
        );
    });
}
function loadCustomFields(fields) {
  customFieldsContainer.innerHTML = "";
  for (const [name, value] of Object.entries(fields)) {
     if (name === "Name" || name === "Surname" || name === "Summary" || name === 'savedForms') continue;

      displayField(name, value);
  }

  document.getElementById("name").value = fields["Name"] || "";
  document.getElementById("surname").value = fields["Surname"] || "";
  document.getElementById("summary").value = fields["Summary"] || "";
}

function computeSimilarity(str1, str2) {
    
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const intersection = words1.filter(value => words2.includes(value));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
}

function displayField(name, value) {
    const fieldDiv = document.createElement("div");
    fieldDiv.className = "field";
    fieldDiv.innerHTML = `
        <strong>${name}</strong>: <span>${value}</span>
        <button type="button" class="editField">Edit</button>
        <button type="button" class="deleteField">Delete</button>
    `;
    customFieldsContainer.appendChild(fieldDiv);

    fieldDiv.querySelector(".editField").addEventListener("click", () => editField(name, value));
    fieldDiv.querySelector(".deleteField").addEventListener("click", () => deleteField(name));
}


function loadApplications() {
    applicationsContainer.innerHTML = '';

    chrome.storage.local.get('jobApplications', (data) => {
        const jobApplications = data.jobApplications || [];

        if (jobApplications.length === 0) {
            applicationsContainer.textContent = "No job applications tracked.";
            return;
        }

        jobApplications.forEach((application, index) => {
            const appDiv = document.createElement('div');
            appDiv.className = 'application-item';

            appDiv.innerHTML = `
                <strong>${application.company}</strong> - ${application.jobTitle}<br>
                Date Applied: ${application.dateApplied}<br>
                Status: ${application.status}
            `;

            const statusSelect = document.createElement('select');
            ['Applied', 'Interviewing', 'Offered', 'Rejected', 'Accepted'].forEach(statusOption => {
                const option = document.createElement('option');
                option.value = statusOption;
                option.textContent = statusOption;
                if (application.status === statusOption) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            });
            statusSelect.addEventListener('change', () => {
                updateApplicationStatus(index, statusSelect.value);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deleteApplication(index);
            });

            appDiv.appendChild(statusSelect);
            appDiv.appendChild(deleteButton);
            applicationsContainer.appendChild(appDiv);
        });
    });
}

function updateApplicationStatus(index, newStatus) {
    chrome.storage.local.get('jobApplications', (data) => {
        const jobApplications = data.jobApplications || [];
        if (jobApplications[index]) {
            jobApplications[index].status = newStatus;
            chrome.storage.local.set({ jobApplications }, () => {
                alert("Application status updated.");
                loadApplications();
            });
        }
    });
}

function deleteApplication(index) {
    if (!confirm("Are you sure you want to delete this application?")) {
        return;
    }
    chrome.storage.local.get('jobApplications', (data) => {
        const jobApplications = data.jobApplications || [];
        if (jobApplications[index]) {
            jobApplications.splice(index, 1);
            chrome.storage.local.set({ jobApplications }, () => {
                alert("Application deleted.");
                loadApplications();
            });
        }
    });
}

// Creating new profile
createProfileButton.addEventListener("click", () => {
    const profileName = prompt("Enter a name for the new profile:");
    if (profileName) {
        chrome.storage.local.get("profiles", (data) => {
            const profiles = data.profiles || {};
            if (profiles[profileName]) {
                alert("Profile with this name already exists.");
                return;
            }

            profiles[profileName] = {};
            chrome.storage.local.set({ profiles, activeProfile: profileName }, () => {
                loadProfiles();
                alert("Profile created successfully.");
            });
        });
    }
});


deleteProfileButton.addEventListener("click", () => {
    const selectedProfile = profileSelector.value;
    if (confirm(`Are you sure you want to delete the profile "${selectedProfile}"?`)) {
        chrome.storage.local.get("profiles", (data) => {
            const profiles = data.profiles || {};
            delete profiles[selectedProfile];

            const newActiveProfile = Object.keys(profiles)[0] || null;
            chrome.storage.local.set({ profiles, activeProfile: newActiveProfile }, () => {
                loadProfiles();
                alert("Profile deleted successfully.");
            });
        });
    }
});


addFieldButton.addEventListener("click", () => {
  const fieldName = fieldNameInput.value.trim();
  const fieldValue = fieldValueInput.value.trim();
  if (!fieldName || !fieldValue) {
      alert("Please provide both a field name and value.");
      return;
  }

  const activeProfile = profileSelector.value;
  chrome.storage.local.get("profiles", (data) => {
      const profiles = data.profiles || {};
      const profile = profiles[activeProfile] || {};

      profile[fieldName] = fieldValue;

      profiles[activeProfile] = profile;
      chrome.storage.local.set({ profiles }, () => {
          loadCustomFields(profile);
          fieldNameInput.value = "";
          fieldValueInput.value = "";
          alert("Field added successfully.");
      });
  });
});

function editField(name, value) {
    fieldNameInput.value = name; 
    fieldValueInput.value = value; 

    
    alert("Edit the field and click Add Field to save changes.");
}

function deleteField(name) {
    const activeProfile = profileSelector.value;
    chrome.storage.local.get("profiles", (data) => {
        const profiles = data.profiles || {};
        const profile = profiles[activeProfile] || {};
        delete profile[name];

        profiles[activeProfile] = profile;
        chrome.storage.local.set({ profiles }, () => {
            loadCustomFields(profile);
        });
    });
}

saveButton.addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const surname = document.getElementById("surname").value.trim();
  const summary = document.getElementById("summary").value.trim();

  if (!name || !summary) {
      alert("Please make sure all fields are filled out.");
      return;
  }

  const activeProfile = profileSelector.value; 
  chrome.storage.local.get("profiles", (data) => {
      const profiles = data.profiles || {};
      const profile = profiles[activeProfile] || {};

      profile["Name"] = name;
      profile["Surname"] = surname;
      profile["Summary"] = summary;

      profiles[activeProfile] = profile; 
      chrome.storage.local.set({ profiles }, () => {
          alert("Data saved successfully!");
      });
  });
});
importDataButton.addEventListener("click", () => {  
 
    importFileInput.click();
});
importFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
        alert("No file selected.");
        return;
    }
   
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
       
            chrome.storage.local.set(importedData, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage set error:", chrome.runtime.lastError);
                    alert("Error saving data to storage.");
                    return;
                }
                loadProfiles();
                alert("Data imported successfully!");
            });
        } catch (error) {
            alert("Error parsing JSON file.");
        }
    };
    reader.onerror = function(e) {
        alert("Error reading file.");
    };
    reader.readAsText(file);
});

exportDataButton.addEventListener("click", () => {
    chrome.storage.local.get(["profiles", "activeProfile"], (data) => {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Creating temporary anchor element to start the download
        const a = document.createElement("a");
        a.href = url;
        a.download = "profiles_data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
function sendDataViaEmail() {
    chrome.storage.local.get(['profiles', 'activeProfile'], (data) => {
        const profiles = data.profiles || {};
        const activeProfile = data.activeProfile;
        const profileData = profiles[activeProfile] || {};

        if (!activeProfile || Object.keys(profileData).length === 0) {
            alert('No profile data available to send.');
            return;
        }

        const subject = encodeURIComponent(`Profile Data: ${activeProfile}`);
        let body = `Here is the profile data for "${activeProfile}":\n\n`;

        for (const [key, value] of Object.entries(profileData)) {
            body += `${key}: ${value}\n`;
        }

        body = encodeURIComponent(body);

        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;

        window.open(mailtoLink, '_blank');
    });
}
// Fetching LinkedIn data
fetchDataButton.addEventListener("click", () => {
    const linkedinUrl = linkedinUrlInput.value;
    if (!linkedinUrl || !linkedinUrl.startsWith("https://www.linkedin.com/in/")) {
        alert("Please enter a valid LinkedIn profile URL.");
        return;
    }

    chrome.tabs.create({ url: linkedinUrl, active: false }, (tab) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                files: ["content.js"],
            },
            () => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === "complete") {
                        chrome.tabs.sendMessage(tab.id, { action: "scrapeLinkedIn" }, (response) => {
                            if (response && response.status === "success") {
                                const { name, surname, summary } = response.data;

                                document.getElementById("name").value = name || "";
                                document.getElementById("surname").value = surname || "";
                                document.getElementById("summary").value = summary || "";

                                alert("Data fetched successfully!");
                            } else {
                                alert("Failed to fetch data. Make sure the profile URL is correct.");
                            }

                            chrome.tabs.remove(tab.id); // Closing temporary tab
                        });
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            }
        );
    });
});
function autoMapFields(formFields, profileFields) {
    const mappings = {};
    const synonyms = {
        'name': ['first name', 'given name', 'forename'],
        'surname': ['last name', 'family name', 'surname'],
        'summary': ['about', 'bio', 'biography'],
        'job title': ['position', 'title'],
        'age': ['birthday', 'birth date', 'date of birth'],
        'email':['email', 'e-mail', 'mail']
        
    };

    formFields.forEach((field) => {
        const candidates = [];

        const fieldAttributes = `${field.name} ${field.id} ${field.placeholder} ${field.label} ${field.ariaLabel} ${field.surroundingText}`.toLowerCase();

        profileFields.forEach((profileField) => {
            const profileFieldName = profileField.toLowerCase();
            const profileFieldSynonyms = synonyms[profileFieldName] || [];
            const comparisonStrings = [profileFieldName, ...profileFieldSynonyms];

            let maxScore = 0;
            comparisonStrings.forEach(compStr => {
                if (fieldAttributes.includes(compStr)) {
                    maxScore = 1; 
                } else {
                    const score = computeSimilarity(fieldAttributes, compStr);
                    if (score > maxScore) {
                        maxScore = score;
                    }
                }
            });

            if (maxScore >= 0.8) {
                candidates.push({
                    profileField: profileField,
                    score: maxScore
                });
            }
        });

        if (candidates.length > 0) {
            candidates.sort((a, b) => b.score - a.score);
            const uniqueKey = field.name || field.id || field.label || field.placeholder || field.ariaLabel || field.surroundingText;
            if (uniqueKey) {
                mappings[uniqueKey] = candidates[0].profileField;
            }
        }
    });

    return mappings;
}



profileSelector.addEventListener("change", () => {
    const selectedProfile = profileSelector.value;
    chrome.storage.local.get("profiles", (data) => {
        const profiles = data.profiles || {};
        const profile = profiles[selectedProfile] || {};

        chrome.storage.local.set({ activeProfile: selectedProfile }, () => {
            loadCustomFields(profile);
            loadSavedForms();
        });
    });
});

