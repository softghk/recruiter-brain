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

const storage = new Storage()

export {}

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

function injectedCode(jobData) {
  console.log("injected code 2")
  window.jobData = jobData
  window.isScraping = true
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
      chrome.tabs.remove(sender.tab.id, () => {})
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
    chrome.tabs.create({ url: externalUrl }, function (tab) {
      chrome.runtime.reload()
    })
  }
})

chrome.tabs.onRemoved.addListener(function (tabId, info) {
  chrome.tabs.get(tabId, function (tab) {
    if (tabId === workingTabId && currentJob?.status !== JobStatus.COMPLETE) {
      stopJob()
    }
  })
})
