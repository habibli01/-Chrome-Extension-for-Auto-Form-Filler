chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "extractData" }, (response) => {
      if (response && response.status === "success") {
        console.log("Data extracted:", response.data);
      }
    });
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    if (message.action === 'saveJobApplication') {
        const jobApplication = message.data;
        chrome.storage.local.get('jobApplications', (data) => {
            const jobApplications = data.jobApplications || [];
            jobApplications.push(jobApplication);
            chrome.storage.local.set({ jobApplications }, () => {
                console.log('Job application saved:', jobApplication);
                sendResponse({ status: 'success' });
            });
        });
        return true;
    }
});

function injectFormListener(tabId) {
  chrome.scripting.executeScript(
      {
          target: { tabId: tabId },
          files: ['formListener.js']
      },
      () => {
          if (chrome.runtime.lastError) {
              console.error('Error injecting formListener.js:', chrome.runtime.lastError.message);
          } else {
              console.log('formListener.js injected into tab:', tabId);
          }
      }
  );
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
      injectFormListener(tabId);
  }
});



  