document.getElementById("fetch-data").addEventListener("click", () => {
    const linkedinUrl = document.getElementById("linkedin-url").value;
  
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
  
                chrome.tabs.remove(tab.id); // Closing the temporary tab
              });
              chrome.tabs.onUpdated.removeListener(listener);
            }
          });
        }
      );
    });
  });

document.getElementById("save-button").addEventListener("click", () => {

    const name = document.getElementById("name").value.trim();
    const summary = document.getElementById("summary").value.trim();
  
    if (!name || !summary) {
      alert("Please make sure both Name and Summary fields are filled out.");
      return;
    }
  
    // Saving data to Chrome's local storage
    const dataToSave = { name, summary };
    chrome.storage.local.set({ scrapedData: dataToSave }, () => {
      alert("Data saved successfully!");
      console.log("Saved data:", dataToSave);
    });
    
  });
  chrome.storage.local.get("scrapedData", (data) => {
    if (data.scrapedData) {
      document.getElementById("name").value = data.scrapedData.name;
      document.getElementById("summary").value = data.scrapedData.summary;
      console.log("Loaded saved data:", data.scrapedData);
    }
  });
  