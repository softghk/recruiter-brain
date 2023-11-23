import { injectControlPanel } from "~utils/inject-control-panel.utils"

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

injectControlPanel()

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    console.log("content chrome runtime", request)
    if (request.action === "extract-and-analyze-profile-data") {
      extractAndEvaluateProfiles()
    }
  }
)

window.addEventListener("message", function (event) {
  if (
    event.source === window &&
    event.data.action === "extract-and-analyze-profile-data"
  ) {
    extractAndEvaluateProfiles()
  }
})

async function extractAndEvaluateProfiles() {
  console.log("Extracting data from candidate list")
  try {
    await scrollPage()
    const profileList = getProfiles()
    processProfileList(profileList)
  } catch (err) {
    console.log("extractAndEvaluateProfiles error:", err)
  }
}

async function scrollPage() {
  createOverlay() // Create the overlay before scrolling
  await scrollToBottom()
  window.scrollTo(0, 0) // Scroll to top after reaching bottom
  removeOverlay() // Remove the overlay after scrolling
}

function getProfiles() {
  const profileList = document.querySelectorAll(".ember-view.profile-list > li")
  console.log("Profiles found:", profileList.length)
  return profileList
}

async function processProfileList(profileList) {
  // Inject loading notice for each profile
  profileList.forEach((profile) => injectWaitingNoticeIntoDom(profile))

  const jobDescription = await getStorageData("jobDescription")
  for (const profile of profileList) {
    const profileUrl = profile.querySelector("a")?.href?.split("?")?.[0]
    const extractedProfile = await extractProfile(profileUrl)
    evaluateProfile(
      profileUrl,
      extractedProfile,
      jobDescription,
      (profileEvaluation) => {
        injectDataIntoDom(profile, profileEvaluation)
      }
    )
  }
}
