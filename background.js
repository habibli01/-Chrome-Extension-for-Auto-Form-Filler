chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "extractData" }, (response) => {
      if (response && response.status === "success") {
      }
    });
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'generateCoverLetter') {
      const { jobApplication, profile } = message.data;

      const userBackground = {
          name: profile.Name || '',
          surname: profile.Surname || '',
          summary: profile.Summary || '',
      };

      const prompt = createCoverLetterPrompt(jobApplication, userBackground);

      callGoogleGeminiAPI(prompt).then((coverLetter) => {
          sendResponse({ status: 'success', coverLetter });
      }).catch((error) => {
          console.error('Error generating cover letter:', error);
          sendResponse({ status: 'failure' });
      });

      return true;
  }else if (message.action === 'saveJobApplication') {
        const jobApplication = message.data;
        chrome.storage.local.get('jobApplications', (data) => {
            const jobApplications = data.jobApplications || [];
            jobApplications.push(jobApplication);
            chrome.storage.local.set({ jobApplications }, () => {
            });
        });
    } else if (message.action === 'generateCoverLetter') {
        const jobApplication = message.data;
        generateCoverLetter(jobApplication);
    }
});


function injectFormListener(tabId) {
  chrome.tabs.get(tabId, (tab) => {
      if (tab.url.startsWith('file://') || tab.url.startsWith('https://') || tab.url.startsWith('http://')) {
          chrome.scripting.executeScript(
              {
                  target: { tabId: tabId },
                  files: ['formListener.js']
              },
              () => {
                  if (chrome.runtime.lastError) {
                      console.error('Error injecting formListener.js:', chrome.runtime.lastError.message);
                  } else {
                  }
              }
          );
      } else {
          console.error('Cannot inject formListener.js into URL:', tab.url);
      }
  });
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
      injectFormListener(tabId);
  }
});
function generateCoverLetter(jobApplication) {
  chrome.storage.local.get(['profiles', 'activeProfile'], (data) => {
      const profiles = data.profiles || {};
      const activeProfile = data.activeProfile;
      const profile = profiles[activeProfile] || {};

      const userBackground = {
          name: profile.Name || '',
          surname: profile.Surname || '',
          summary: profile.Summary || '',
      };

      const prompt = createCoverLetterPrompt(jobApplication, userBackground);
      
      callGoogleGeminiAPI(prompt).then((coverLetter) => {
          jobApplication.coverLetter = coverLetter;

          chrome.storage.local.get('jobApplications', (data) => {
              const jobApplications = data.jobApplications || [];
              const index = jobApplications.findIndex(app => app.company === jobApplication.company && app.jobTitle === jobApplication.jobTitle && app.dateApplied === jobApplication.dateApplied);
              if (index !== -1) {
                  jobApplications[index] = jobApplication;
              } else {
                  jobApplications.push(jobApplication);
              }
              chrome.storage.local.set({ jobApplications }, () => {
                  console.log('Cover letter generated and saved.');
              });
          });
      }).catch((error) => {
          console.error('Error generating cover letter:', error);
      });
  });
}


function createCoverLetterPrompt(jobApplication, userBackground) {
  return `Write a cover letter for the position of ${jobApplication.jobTitle} (if unknown just skip) at ${jobApplication.company}(if unknown just skip). Use the following background information about me:

Name: ${userBackground.name} ${userBackground.surname}
Summary: ${userBackground.summary}
Here is the full data about user: ${userBackground}
Keep it brief, and like human wrote it. 
Make sure the cover letter is tailored to the job and company, highlighting relevant skills and experiences.`;
}



async function callGoogleGeminiAPI(prompt) {
  const apiKey = 'AIzaSyBx7YaC3lE0d7MRQTCAfV0BNzdLNByHbbo'; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;


  const requestBody = {
    contents: [
        {
            parts: [
                {
                    text: prompt
                }
            ]
        }
    ]
};

  

try {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}: ${errorText}`);
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (
      data &&
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0 &&
      data.candidates[0].content.parts[0].text
  ) {
      return data.candidates[0].content.parts[0].text;
  } else {
      console.error('No cover letter generated. API response:', data);
      throw new Error('No cover letter generated.');
  }
} catch (error) {
    console.error('Error during fetch:', error);
    throw error;
}
}
