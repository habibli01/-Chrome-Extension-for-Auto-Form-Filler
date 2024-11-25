
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

document.addEventListener("DOMContentLoaded", () => {
    loadProfiles();
    
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

        // Loading custom fields for the active profile
        if (activeProfile && profiles[activeProfile]) {
            loadCustomFields(profiles[activeProfile]);
        } else {
            customFieldsContainer.innerHTML = ""; 
        }
    });
}

function loadCustomFields(fields) {
  customFieldsContainer.innerHTML = "";
  for (const [name, value] of Object.entries(fields)) {
     if (name === "Name" || name === "Surname" || name === "Summary") continue;

      displayField(name, value);
  }

  document.getElementById("name").value = fields["Name"] || "";
  document.getElementById("surname").value = fields["Surname"] || "";
  document.getElementById("summary").value = fields["Summary"] || "";
}


// Display a single custom field in the UI
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

profileSelector.addEventListener("change", () => {
    const selectedProfile = profileSelector.value;
    chrome.storage.local.get("profiles", (data) => {
        const profiles = data.profiles || {};
        const activeProfileFields = profiles[selectedProfile] || {};

        chrome.storage.local.set({ activeProfile: selectedProfile }, () => {
            loadCustomFields(activeProfileFields);
        });
    });
});
