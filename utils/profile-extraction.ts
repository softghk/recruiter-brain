export async function extractProfile(profile) {
  const href = profile.querySelector("a")?.href
  const prospectName = profile.querySelector("a")?.text.trim()
  console.log("getting profile from", prospectName)
  if (href) {
    try {
      const scrapedProfileData: any =
        await extractProfileDataInBackgroundTab(href)
      console.log(`Scrapped data`, scrapedProfileData)

      return scrapedProfileData
    } catch (error) {
      console.error("Error in extracting profile:", error)
    }
  } else {
    console.error("No href found for profile:", profile)
  }
}

async function extractProfileDataInBackgroundTab(profileUrl: string) {
  return new Promise((resolve, reject) => {
    let isResponseReceived = false

    // Function to handle messages from the background script
    function handleResponse(response, sender, sendResponse) {
      isResponseReceived = true
      chrome.runtime.onMessage.removeListener(handleResponse)

      if (response.action === "extractedLinkedInData") {
        if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response.data)
        }
      }
    }

    // Add message listener
    chrome.runtime.onMessage.addListener(handleResponse)

    // Sending profile data
    chrome.runtime.sendMessage({
      action: "open-tab-in-background-and-extract-profile-data",
      url: profileUrl
    })

    // Implement a timeout
    const timeout = 30000 // 30 seconds, adjust as needed
    setTimeout(() => {
      if (!isResponseReceived) {
        chrome.runtime.onMessage.removeListener(handleResponse)
        reject(
          new Error("Timeout waiting for the response from background script")
        )
      }
    }, timeout)
  })
}
