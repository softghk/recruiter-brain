import axios from "axios"

import { scrollToBottom } from "./utils/scroll-to-bottom.utils"

export {}

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    if (request.action === "extract-and-analyze-profile-data") {
      extractAndEvaluateProfiles()
    }
  }
)

async function extractAndEvaluateProfiles() {
  console.log("Extracting data from candidate list")
  try {
    await scrollToBottom()
    window.scrollTo(0, 0) // Scroll to top after reaching bottom

    const profileList = document.querySelectorAll(
      ".ember-view.profile-list > li"
    )
    console.log("Profiles found:", profileList.length)

    for (const profile of profileList) {
      const extractedProfile = await extractProfile(profile)
      evaluateProfile(extractedProfile, (profileEvaluation) => {
        const rating = profileEvaluation.data.rating
        const evaluation = profileEvaluation.data.evaluation

        // Inject response into DOM
        const targetElement = profile.querySelector(
          ".profile-list__border-bottom .history-group"
        ) // Adjust the selector as necessary

        const injectedDataHtml = `
                <div style="margin-top: 20px; padding: 16px; background-color: #f3f6f8; border-radius: 8px; border: 1px solid #dce0e0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                <div style="font-weight: 800; font-size: 16px; color: #303030; margin-bottom: 8px;">Rating: ${rating}</div>
                  <div style="font-weight: 600; font-size: 14px; color: #303030; margin-bottom: 8px;">Role Fit Rating Explained</div>
                  <div style="font-size: 14px; line-height: 1.5; color: #303030;">${evaluation}</div>
                </div>
              `

        // Insert the HTML snippet after the target element
        targetElement.insertAdjacentHTML("afterend", injectedDataHtml)
      })
    }
  } catch (err) {
    console.log("err", err)
  }
}

async function extractProfile(profile) {
  const href = profile.querySelector("a")?.href
  const prospectName = profile.querySelector("a")?.text.trim()
  console.log("getting profile from", prospectName)
  if (href) {
    try {
      const scrapedProfileData: any = await scrapeProfileData(href)
      console.log(`Scrapped data`, scrapedProfileData)
      // work here with successful extracted data!
      // 1. Send to backend API
      // 2. Inject response into DOM
      return scrapedProfileData
    } catch (error) {
      console.error("Error in extracting profile:", error)
    }
  } else {
    console.error("No href found for profile:", profile)
  }
}

async function evaluateProfile(extractedProfile, callback) {
  const jobDescription = await getStorageData("jobDescription")

  axios
    .post("http://localhost:3000/evaluation", {
      vc: extractedProfile.positions,
      jobDescription: jobDescription
    })
    .then((response: any) => {
      console.log(
        "the evaluation for ",
        extractedProfile.personal.name,
        " is ",
        response.data.rating,
        response.data.evaluation
      )
      callback(response)
    })
    .catch((error) => {
      console.log("error during evaluation")
    })
}

async function scrapeProfileData(profileUrl: string) {
  return new Promise((resolve, reject) => {
    // Function to handle messages from the background script
    function handleResponse(response, sender, sendResponse) {
      if (response.action === "linkedInData") {
        chrome.runtime.onMessage.removeListener(handleResponse)
        resolve(response.data)
      }
    }

    // Add message listener
    chrome.runtime.onMessage.addListener(handleResponse)

    // Sending profile data
    chrome.runtime.sendMessage({
      action: "open-tab-in-background-and-scrape-profile-data",
      url: profileUrl
    })
  })
}

// helper function
const getStorageData = (key: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }
      resolve(result[key])
    })
  })
}
