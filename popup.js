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
                  const { name, summary } = response.data;
  
                  document.getElementById("name").value = name || "";
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
  