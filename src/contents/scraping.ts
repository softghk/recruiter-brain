import { addOverlay } from "~src/utils/add-overlay"
import { extractLinkedInData } from "~src/utils/extract-linkedin-data"
import {
  waitForContainerChanges,
  waitForElement
} from "~src/utils/wait-for.utils"

async function scrapingCode(jobData) {
  addOverlay()
  // wait for profile list
  await waitForElement("a[data-live-test-link-to-profile-link]")
  // open first profile in list
  const profileLink = document.querySelector(
    "a[data-live-test-link-to-profile-link]"
  )
  if (profileLink) {
    profileLink.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    )
  }

  // tell background script that page is loaded
  // chrome.runtime.sendMessage({ done: true })

  var run = 0
  console.time("CompleteJobTime")
  while (run < jobData.amount) {
    console.log("run start")
    console.time("Step1Time")
    console.time("CompleteTime")
    await new Promise((resolve) => setTimeout(resolve, 3500))
    // extract data when ready
    await waitForElement(".experience-card")
    console.timeEnd("Step1Time")

    // Find all buttons with 'data-test-expandable-button' attribute and click each one
    console.log("clicking buttons more")
    console.time("Step2Time")
    await waitForElement("button[data-test-expandable-button]")
    var buttons = document.querySelectorAll(
      "button[data-test-expandable-button]"
    )
    buttons.forEach((button) => {
      ;(button as HTMLButtonElement).click()
    })
    console.timeEnd("Step2Time")

    // Wait for 100ms after all buttons have been clicked
    await new Promise((resolve) => setTimeout(resolve, 100))

    console.log("extracting data")
    console.time("Step3Time")
    const currentTaskId = run
    const linkedInData = extractLinkedInData()
    console.log("extracted data", linkedInData)
    console.timeEnd("Step3Time")

    // console.log("task, skills:", linkedInData?.skills?.length)

    chrome.runtime.sendMessage({
      jobId: jobData.jobId,
      jobData: jobData,
      taskId: currentTaskId,
      linkedInData: linkedInData
    })

    // go to next profile
    run++

    console.time("Step4Time")
    const nextButton = document.querySelector(
      "a[data-test-pagination-next]"
    ) as HTMLAnchorElement
    nextButton.click()
    await waitForContainerChanges(".profile__container")
    await waitForElement("[data-test-expandable-list-title]")
    console.timeEnd("Step4Time")
    console.timeEnd("CompleteTime")
    console.log("run end")
  }
  console.timeEnd("CompleteJobTime")
  // chrome.runtime.sendMessage({
  //   action: "close-tab"
  // })
}

if (window["isScraping"]) {
  const jobData = window["jobData"]
  scrapingCode(jobData)
}
