import { evaluateProfile } from "./utils/api-service.utils"
import {
  createOverlay,
  injectDataIntoDom,
  injectWaitingNoticeIntoDom,
  removeOverlay
} from "./utils/dom-manipulation.utils"
import { extractProfile } from "./utils/profile-extraction"
import { scrollToBottom } from "./utils/scroll-to-bottom.utils"
import { getStorageData } from "./utils/storage.utils"

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
    createOverlay() // Create the overlay before scrolling
    await scrollToBottom()
    window.scrollTo(0, 0) // Scroll to top after reaching bottom
    removeOverlay() // Remove the overlay after scrolling

    const profileList = document.querySelectorAll(
      ".ember-view.profile-list > li"
    )
    console.log("Profiles found:", profileList.length)

    processProfileList(profileList)
  } catch (err) {
    console.log("extractAndEvaluateProfiles error:", err)
  }
}

async function processProfileList(profileList) {
  // Inject loading notice for each profile
  profileList.forEach((profile) => injectWaitingNoticeIntoDom(profile))

  const jobDescription = await getStorageData("jobDescription")
  for (const profile of profileList) {
    const extractedProfile = await extractProfile(profile)
    evaluateProfile(extractedProfile, jobDescription, (profileEvaluation) => {
      injectDataIntoDom(profile, profileEvaluation)
    })
  }
}
