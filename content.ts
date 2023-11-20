import { evaluateProfile } from "./utils/api-service.utils"
import { injectDataIntoDom } from "./utils/dom-manipulation.utils"
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
    await scrollToBottom()
    window.scrollTo(0, 0) // Scroll to top after reaching bottom

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
  const jobDescription = await getStorageData("jobDescription")
  for (const profile of profileList) {
    const extractedProfile = await extractProfile(profile)
    evaluateProfile(extractedProfile, jobDescription, (profileEvaluation) => {
      injectDataIntoDom(profile, profileEvaluation)
    })
  }
}
