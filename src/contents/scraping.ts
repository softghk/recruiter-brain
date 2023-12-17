import { ActionTypes } from "~src/types"
import { addOverlay } from "~src/utils/add-overlay"
import { extractLinkedInData } from "~src/utils/extract-linkedin-data"
import {
  waitForContainerChanges,
  waitForElement
} from "~src/utils/wait-for.utils"

async function openFirstProfile() {
  await waitForElement("a[data-live-test-link-to-profile-link]")
  const profileLink = document.querySelector("a[data-live-test-link-to-profile-link]")
  if (profileLink) {
    profileLink.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
  }
}

async function clickExpandableButtons() {
  await waitForElement("button[data-test-expandable-button]")
  var buttons = document.querySelectorAll("button[data-test-expandable-button]")
  buttons.forEach((button) => {
    ; (button as HTMLButtonElement).click()
  })
}

async function goToNextProfile() {
  const nextButton = document.querySelector("a[data-test-pagination-next]") as HTMLAnchorElement
  nextButton.click()
  await waitForContainerChanges(".profile__container")
  await waitForElement("[data-test-expandable-list-title]")
}

async function scrapeMultipleProfiles(jobData) {
  addOverlay()
  openFirstProfile()

  chrome.runtime.sendMessage({ action: ActionTypes.SWITCH_BACK_TO_MAIN_TAB })

  var run = 0
  console.time("CompleteJobTime")
  while (run < jobData.amount) {
    console.time("CompleteTime")
    await new Promise((resolve) => setTimeout(resolve, 3500))

    await waitForElement(".experience-card")

    clickExpandableButtons()

    await new Promise((resolve) => setTimeout(resolve, 100))

    const currentTaskId = run
    const linkedInData = extractLinkedInData()

    chrome.runtime.sendMessage({
      action: ActionTypes.TASK_DATA_RECEIVED,
      jobId: jobData.jobId,
      jobData: jobData,
      taskId: currentTaskId,
      linkedInData: linkedInData
    })

    run++

    goToNextProfile()

    console.timeEnd("CompleteTime")
  }
  console.timeEnd("CompleteJobTime")
  chrome.runtime.sendMessage({
    action: "close-tab"
  })
}

if (window["isScraping"]) {
  const jobData = window["jobData"]
  scrapeMultipleProfiles(jobData)
}