
(function () {
    if (window.hasRun) {
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
      const full = nameElement ? nameElement.innerText.split(" ") : "Name not found";
      const name = full[0];
      const surname = full.length > 1 ? full[1] : "";

      // Getting summary
      const summaryElement = document.querySelector('div.text-body-medium.break-words[data-generated-suggestion-target]');// from the className of title in Linkedin
      const alternativeSummary =  document.querySelector('.top-card-layout__headline'); //if user is not logged in to linkedin and want get account's data
      const summary = summaryElement ? summaryElement.textContent.trim() : alternativeSummary.textContent.trim();
      
  
      return { name, surname, summary };
    }
  })();
  