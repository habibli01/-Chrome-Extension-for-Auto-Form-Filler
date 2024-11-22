chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "extractData" }, (response) => {
      if (response && response.status === "success") {
        console.log("Data extracted:", response.data);
      }
    });
  });
  