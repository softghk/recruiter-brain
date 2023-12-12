// @ts-nocheck
import { v4 as uuidv4 } from "uuid"

import { Storage } from "@plasmohq/storage"

import { evaluateProfileApi } from "~utils/api-service.utils"

import {
  CANDIDATE_RATING,
  JOB_DESCRIPTION,
  JOB_RUNNING
} from "./config/storage.config"
import type { CandidateRating } from "./types"
import {
  createDatabase,
  deleteAllDatabases,
  deleteAllFromIndexedDB,
  deleteDataFromIndexedDB,
  getDataFromIndexedDB,
  saveDataToIndexedDB
} from "./utils/indexed-db.utils"
import { sendMessageToContentScript } from "./utils/message.utils"
import { notifyContentScript } from "./utils/notify-content-script.utils"
import { extractLinkedInData } from "./utils/extract-linkedin-data.utils"

const storage = new Storage()

export { }

// Action types for clarity and typo prevention
const ActionTypes = {
  EVALUATE_PROFILES: "evaluate-profiles",
  GET_STATUS: "get-status",
  PAUSE_JOB: "pause-job",
  RESUME_JOB: "resume-job",
  STOP_JOB: "stop-job",
  TASK_DATA_RECEIVED: "task-data-received",
  GET_JOB_DETAILS: "get-job-details",
  CLOSE_TAB: "close-tab"
}

// Job and Task Statuses
const JobStatus = {
  PENDING: "pending",
  COMPLETE: "complete",
  FAILED: "failed",
  PAUSED: "paused"
}

// Current job and its tasks
let currentJob = null
let tasks = []
let workingTabId = null

const openTabAndInjectCode = (jobData) => {
  // Get the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
    if (activeTabs.length > 0) {
      const currentActiveTab = activeTabs[0]

      // Create a new tab as active
      chrome.tabs.create({ url: currentJob.href, active: true }, (newTab) => {
        workingTabId = newTab.id
        // Inject code into the newly opened tab
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          function: injectedCode,
          args: [jobData]
        })

        // Listen for a message from the content script in the new tab
        chrome.runtime.onMessage.addListener(
          (message, sender, sendResponse) => {
            if (message && message.done) {
              // Switch back to the previously active tab when the content script signals it's done
              chrome.tabs.update(currentActiveTab.id, { active: true })
            }
          }
        )
      })
    }
  })
}

// Handle job evaluation
// this function is called from the content script
const evaluateProfiles = (jobData) => {
  const jobId = uuidv4()
  currentJob = { ...jobData, status: JobStatus.PENDING, jobId: jobId }
  tasks = Array.from({ length: jobData.amount }, (_, i) => ({
    id: i,
    status: JobStatus.PENDING
  }))

  openTabAndInjectCode({ ...jobData, jobId: jobId })
}

// Mock API call with a timeout, then save data to IndexedDB
const makeAPICallAndSaveData = async (data, jobData) => {
  const taskId = jobData.taskId
  const jobId = jobData.jobId
  const profileUrl = data.personal.url
  const profileId = profileUrl.match(/\/profile\/([^\/]+)$/)[1]
  const jobDescriptionId = jobData.jobDescriptionId
  console.log("API Call000", data, jobData, profileId)
  const profileEvaluation = await evaluateProfileApi(
    profileId,
    jobDescriptionId,
    data,
    jobData.jobDescription
  )
  console.log("api response", profileEvaluation)
  saveDataToIndexedDB({
    projectId: jobData.projectId,
    jobDescriptionId: jobData.jobDescriptionId,
    profileId: data.personal.id,
    evaluation: profileEvaluation,
    evaluationRating: -1
  }).then(async () => {
    notifyContentScript("itemAddedToIndexedDb")
    const rating = await storage.get(CANDIDATE_RATING)
    if (!rating[jobData.projectId]) {
      rating[jobData.projectId] = profileEvaluation.rating
      storage.set(CANDIDATE_RATING, rating)
    } else {
      const oldAvg: CandidateRating = rating[jobData.projectId]
      const newAvg: CandidateRating = {
        education: (oldAvg.education + profileEvaluation.rating.education) / 2,
        experience:
          (oldAvg.experience + profileEvaluation.rating.experience) / 2,
        skills: (oldAvg.skills + profileEvaluation.rating.skills) / 2,
        overall: (oldAvg.overall + profileEvaluation.rating.overall) / 2,
        total: (oldAvg.total + profileEvaluation.rating.total) / 2
      }
      storage.set(CANDIDATE_RATING, { ...rating, [jobData.projectId]: newAvg })
    }
  })
  markTaskAsComplete(taskId, jobId)
}

// Mark the current task as complete
const markTaskAsComplete = (taskId, jobId) => {
  console.log("markTaskAsComplete", taskId, jobId)
  if (currentJob && currentJob.jobId === jobId) {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      task.status = JobStatus.COMPLETE
      // Check if all tasks are complete and update job status if necessary
      // ... additional logic ...
    }
  }

  if (areAllComplete(tasks)) {
    currentJob.status = JobStatus.COMPLETE
  }

  function areAllComplete(arr) {
    return arr.every((item) => item?.status === "complete")
  }
}

// The code to be injected into the new tab
async function injectedCode(jobData) {
  async function waitForElement2(selector) {
    return new Promise((resolve) => {
      let element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      let observer = new MutationObserver(function (mutations, me) {
        let element = document.querySelector(selector)
        if (element) {
          resolve(element)
          me.disconnect() // Stop observing
          return
        }
      })

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      })
    })
  }

  // Function to wait for changes within a specific container using a timeout
  function waitForContainerChanges(containerSelector, timeout = 500) {
    return new Promise((resolve) => {
      const container = document.querySelector(containerSelector)

      if (!container) {
        resolve()
        return
      }

      const startTime = Date.now()

      const checkChanges = () => {
        const observer = new MutationObserver(() => {
          observer.disconnect()
          resolve()
        })

        observer.observe(container, { childList: true })

        setTimeout(() => {
          observer.disconnect()
          resolve()
        }, timeout)
      }

      // Check for changes immediately and set up a timeout
      checkChanges()

      const intervalId = setInterval(() => {
        if (Date.now() - startTime >= timeout) {
          clearInterval(intervalId)
          resolve()
        } else {
          checkChanges()
        }
      }, 300)
    })
  }
  function addOverlay() {
    const logoSrc = "https://i.ibb.co/DDZFTbv/logo.png" // Replace with your logo image

    // Create a div element for the overlay
    const overlay = document.createElement("div")
    overlay.style.position = "fixed"
    overlay.style.top = "0"
    overlay.style.left = "0"
    overlay.style.width = "100%"
    overlay.style.height = "100%"
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)" // Semi-transparent dark background
    overlay.style.display = "flex"
    overlay.style.justifyContent = "center"
    overlay.style.alignItems = "center"
    overlay.style.zIndex = "9999" // Ensure it's above other content;

    // Create a container for the content
    const contentContainer = document.createElement("div")
    contentContainer.style.backgroundColor = "#fff" // Light background for content
    contentContainer.style.padding = "20px"
    contentContainer.style.borderRadius = "10px"
    contentContainer.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)"
    contentContainer.style.maxWidth = "80%"

    // Create an image element for the logo
    const logo = document.createElement("img")
    logo.src = logoSrc
    logo.style.maxWidth = "150px" // Customize the logo size as needed
    logo.style.display = "block" // Center the logo

    // Create a div element for the text
    const textDiv = document.createElement("div")
    textDiv.style.color = "#333" // Customize text color
    textDiv.style.marginTop = "20px" // Add spacing above the text
    textDiv.textContent = "Please wait..."
    textDiv.innerHTML = `<h3><strong>Please wait while we process your request.</strong></h3>
    <div style="padding:20px;" id="brain-info">
      <ul>
        <li>Do not close this tab.</li>
        <li>Once the process is complete, this tab will close automatically.</li>
        <li>You can use the browser as usual in the meantime.</li>
        <li><b>Recommended: Keep this tab open for faster processing.</b></li>
      </ul>
    </div>
  
`

    // Append the logo and textDiv to the content container
    contentContainer.appendChild(logo)
    contentContainer.appendChild(textDiv)

    // Append the content container to the overlay
    overlay.appendChild(contentContainer)

    // Append the overlay to the body of the page
    document.body.appendChild(overlay)
  }


  addOverlay()
  // wait for profile list
  await waitForElement2("a[data-live-test-link-to-profile-link]")
  // open first profile in list
  document.querySelector("a[data-live-test-link-to-profile-link]").click()

  // tell background script that page is loaded
  chrome.runtime.sendMessage({ done: true })

  var run = 0
  console.time("CompleteJobTime")
  while (run < jobData.amount) {
    console.log("run start")
    console.time("Step1Time")
    console.time("CompleteTime")
    await new Promise((resolve) => setTimeout(resolve, 3500))
    // extract data when ready
    await waitForElement2(".experience-card")
    console.timeEnd("Step1Time")

    // Find all buttons with 'data-test-expandable-button' attribute and click each one
    console.log("clicking buttons more")
    console.time("Step2Time")
    await waitForElement2("button[data-test-expandable-button]")
    var buttons = document.querySelectorAll(
      "button[data-test-expandable-button]"
    )
    buttons.forEach((button) => {
      button.click()
    })
    console.timeEnd("Step2Time")

    // Wait for 100ms after all buttons have been clicked
    await new Promise((resolve) => setTimeout(resolve, 700))

    console.log("extracting data")
    console.time("Step3Time")
    const currentTaskId = run
    const linkedInData = extractLinkedInData()
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
    const nextButton = document.querySelector("a[data-test-pagination-next]")
    nextButton.click()
    await waitForContainerChanges(".profile__container")
    await waitForElement2("[data-test-expandable-list-title]")
    console.timeEnd("Step4Time")
    console.timeEnd("CompleteTime")
    console.log("run end")
  }
  console.timeEnd("CompleteJobTime")
  chrome.runtime.sendMessage({
    action: "close-tab"
  })
}

// Stop the job
const stopJob = () => {
  storage.set(JOB_RUNNING, false)
  chrome.tabs.remove(workingTabId, function () {
    currentJob = null
    tasks = []
    workingTabId = null
    console.log("tab closed")
  })
}

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case ActionTypes.EVALUATE_PROFILES:
      console.log("evaluateProfiles request.data", request.data)
      evaluateProfiles(request.data)
      break
    case ActionTypes.GET_STATUS:
      sendResponse({ currentJob, tasks })
      break
    case ActionTypes.STOP_JOB:
      console.log("STOP JOB message received")
      stopJob()
      sendResponse({ status: "Job stopped" })
      break
    case ActionTypes.GET_JOB_DETAILS:
      storage.get(JOB_DESCRIPTION).then((response) => {
        sendResponse({ data: response })
      })
      break
    case ActionTypes.CLOSE_TAB:
      console.log("close tab", sender)
      chrome.tabs.remove(sender.tab.id, () => { })
      break
    case "delete-db":
      console.log("DELETE DB ACTION DISPATCHED")
      storage.get(CANDIDATE_RATING).then((response) => {
        const newRating = { ...response }
        delete newRating[request.data]
        storage.set(CANDIDATE_RATING, newRating)
      })
      deleteAllFromIndexedDB({ projectId: request.data }).then((response) => {
        console.log("got response after delete db")
        sendMessageToContentScript("delete-db")
        sendResponse({ data: response })
      })
      break
    case "delete-db-all":
      console.log("DELEATE ALL DATABASE")
      deleteAllDatabases().then(() => {
        console.log("got response after delete all db")
        storage.removeAll()
        sendMessageToContentScript("delete-db")
        sendMessageToContentScript("reset-all")
        sendResponse({ data: "" })
      })
      break
  }

  if (sender.tab && request.taskId !== undefined) {
    makeAPICallAndSaveData(request.linkedInData, {
      ...request.jobData,
      taskId: request.taskId
    })
  }

  return true // Indicate that the response is asynchronous
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDataFromIndexedDB") {
    console.log("RECEIVED REQUEST: getDataFromIndexedDB")
    getDataFromIndexedDB(request.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error }))
    return true // Indicates asynchronous response
  }

  if (request.action === "updateDataFromIndexedDB") {
    const data = request.payload
    deleteDataFromIndexedDB(data).then(() => {
      saveDataToIndexedDB(data).then(() => {
        notifyContentScript("itemAddedToIndexedDb")
      })
    })
  }

  if (request.action === "createDatabase") {
    createDatabase().then(() => sendResponse())
  }
})

chrome.runtime.onInstalled.addListener(function (object) {
  createDatabase()
  let externalUrl = "https://www.linkedin.com/talent/hire/"

  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: externalUrl }, function (tab) { })
  }
})

chrome.tabs.onRemoved.addListener(function (tabId, info) {
  chrome.tabs.get(tabId, function (tab) {
    if (tabId === workingTabId && currentJob?.status !== JobStatus.COMPLETE) {
      stopJob()
    }
  })
})
