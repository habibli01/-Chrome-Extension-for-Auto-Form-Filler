
(function () {
    if (window.hasRun) {
      console.log("Content script already running.");
      return;
    }
    window.hasRun = true;
  
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "scrapeLinkedIn") {
        try {
          const data = scrapeLinkedInProfile();
          sendResponse({ status: "success", data });
        } catch (error) {
          console.error("Error scraping LinkedIn data:", error);
          sendResponse({ status: "error", message: error.message });
        }
      }
    });
  
   
    function scrapeLinkedInProfile() {
    
  
      // Getting name
      const nameElement = document.querySelector('h1');
      const name = nameElement ? nameElement.textContent.trim() : "Name not found";
  
      // Getting summary
      const summaryElement = document.querySelector('div.text-body-medium.break-words[data-generated-suggestion-target]'); // from the className of title in Linkedin
      const summary = summaryElement ? summaryElement.textContent.trim() : "Summary not found";
      
      console.log("Scraped LinkedIn Data:", { name, summary });
  
      return { name, summary };
    }
  })();
  