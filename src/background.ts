import { v4 as uuidv4 } from "uuid"

import { Storage } from "@plasmohq/storage"

import {
  CANDIDATE_RATING,
  JOB_DESCRIPTION,
  JOB_RUNNING
} from "./config/storage.config"
import {
  ActionTypes,
  JobStatus,
  type JobData,
  type Task
} from "./types"
import { evaluateProfileApi } from "./utils/api-service.utils"
import { calculateAverageRatings } from "./utils/average.util"
import {
  deleteAllDatabases,
  deleteAllFromIndexedDB,
  deleteDataFromIndexedDB,
  getEvaluationFromIndexedDB,
  getEvaluationsFromIndexedDB,
  saveDataToIndexedDB
} from "./utils/indexed-db.utils"
import { sendMessageToContentScript } from "./utils/message.utils"
import { notifyContentScript } from "./utils/notify-content-script.utils"

const storage = new Storage()

// Current job and its tasks
let currentJob = null
let tasks: Task[] = []
let workingTabId = null

chrome.runtime.onMessage.addListener(handleChromeRuntimeMessage)
chrome.runtime.onInstalled.addListener(handleExtensionInstalled)
chrome.tabs.onRemoved.addListener(handleTabRemoved)

const actionHandlers = {
  // Profile Evaluation
  [ActionTypes.EVALUATE_PROFILES]: handleProfileEvaluation,
  [ActionTypes.GET_EVALUATION]: handleEvaluationRetrieval,
  [ActionTypes.GET_EVALUATIONS_AVERAGE]: handleAverageEvaluationRequest,

  // Handling
  [ActionTypes.TASK_DATA_RECEIVED]: handleReceivedTaskData,
  [ActionTypes.CLOSE_TAB]: handleTabCloseRequest,

  // Job
  [ActionTypes.GET_STATUS]: handleJobStatusRequest,
  [ActionTypes.STOP_JOB]: handleJobStopRequest,
  [ActionTypes.GET_JOB_DETAILS]: handleJobDetailsRequest,

  // Project
  [ActionTypes.CLEAR_PROJECT_DATA]: handleProjectDataClearRequest,

  // Database
  [ActionTypes.DELETE_ALL_DATABASE]: handleDatabaseDeletionRequest,
  [ActionTypes.UPDATE_DATA]: handleDataUpdateRequest
}

async function handleChromeRuntimeMessage(request, sender, sendResponse) {
  const handler = actionHandlers[request.action]
  if (handler) {
    try {
      await handler(request, sender, sendResponse)
    } catch (error) {
      console.error(`Error handling action ${request.action}: ${error}`)
    }
  } else {
    console.log("action handling not implemented", request.action)
  }
  return true
}

function handleExtensionInstalled(object) {
  const externalUrl = "https://www.linkedin.com/talent/hire/"
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: externalUrl }, function (tab) { })
  }
}

async function handleTabRemoved(tabId, info) {
  try {
    chrome.tabs.get(tabId, async function (tab) {
      if (tabId === workingTabId && currentJob?.status !== JobStatus.COMPLETE) {
        await stopJob()
      }
    })
  } catch (error) {
    console.error(`Error in handleTabRemoved: ${error}`)
  }
}

// BEGIN: Handle tasks received from content script
function handleProfileEvaluation(request, sender, sendResponse) {
  evaluateProfiles(request.data)
}

function handleJobStatusRequest(request, sender, sendResponse) {
  sendResponse({ currentJob, tasks })
}

function handleJobStopRequest(request, sender, sendResponse) {
  stopJob()
  sendResponse({ status: JobStatus.STOPPED })
}

function handleJobDetailsRequest(request, sender, sendResponse) {
  storage.get(JOB_DESCRIPTION).then((response) => {
    sendResponse({ data: response })
  })
}

function handleProjectDataClearRequest(request, sender, sendResponse) {
  storage.get(CANDIDATE_RATING).then((response) => {
    // @ts-ignore
    const newRating = { ...response }
    delete newRating[request.data]
    storage.set(CANDIDATE_RATING, newRating)
  })
  deleteAllFromIndexedDB({ projectId: request.data }).then((response) => {
    console.log("got response after delete db")
    sendMessageToContentScript(ActionTypes.DELETE_DB)
    sendResponse({ data: response })
  })
}

function handleTabCloseRequest(request, sender, sendResponse) {
  chrome.tabs.remove(sender.tab.id, () => { })
}

function handleDatabaseDeletionRequest(request, sender, sendResponse) {
  deleteAllDatabases().then(() => {
    console.log("got response after delete all db")
    storage.removeAll()
    sendMessageToContentScript(ActionTypes.DELETE_DB)
    sendMessageToContentScript(ActionTypes.RESET_ALL)
    sendResponse({ data: "" })
  })
}

function handleReceivedTaskData(request, sender, sendResponse) {
  console.log("handleReceivedTaskData", request)
  fetchAndStoreProfileData(request.linkedInData, {
    ...request.jobData,
    taskId: request.taskId
  })
}

function handleEvaluationRetrieval(request, sender, sendResponse) {
  getEvaluationFromIndexedDB(request.payload)
    .then((data) => sendResponse({ success: true, data }))
    .catch((error) => sendResponse({ success: true, data: null }))
  return true // Indicates asynchronous response
}

function handleDataUpdateRequest(request, sender, sendResponse) {
  const data = request.payload
  deleteDataFromIndexedDB(data).then(() => {
    saveDataToIndexedDB(data).then(() => {
      notifyContentScript(ActionTypes.ITEM_ADDED)
    })
  })
}

async function handleAverageEvaluationRequest(request, sender, sendResponse) {
  const { projectId, jobDescriptionId } = request.payload
  const evaluations = await getEvaluationsFromIndexedDB({
    projectId,
    jobDescriptionId
  })
  const averages = calculateAverageRatings(evaluations)
  sendResponse({ success: true, data: averages })
}

// END: Handle tasks received from content script

async function evaluateProfiles(jobData: JobData) {
  const jobId = uuidv4()
  const newJobData = { ...jobData, jobId: jobId }
  currentJob = { ...jobData, status: JobStatus.PENDING, jobId: jobId }
  tasks = Array.from({ length: jobData.amount }, (_, i) => ({
    id: i,
    status: JobStatus.PENDING
  }))

  try {
    const activeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })
    if (activeTabs.length > 0) {
      const currentActiveTab = activeTabs[0]

      const newTab = await chrome.tabs.create({
        url: jobData.href,
        active: true
      })
      workingTabId = newTab.id

      await chrome.scripting.executeScript({
        target: { tabId: newTab.id },
        // @ts-ignore
        function: (jobData) => {
          window.jobData = jobData
          window.isScraping = true
        },
        args: [newJobData]
      })

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === ActionTypes.SWITCH_BACK_TO_MAIN_TAB) {
          chrome.tabs.update(currentActiveTab.id, { active: true })
        }
      })
    }
  } catch (error) {
    console.error("Error in initiateJobProcessing:", error)
  }
}

// Mock API call with a timeout, then save data to IndexedDB
async function fetchAndStoreProfileData(profileData, jobData: JobData) {
  console.log("jobData", jobData)
  const taskId = jobData.taskId
  const jobId = jobData.jobId
  const profileUrl = profileData.personal.url
  const profileId = profileUrl.match(/\/profile\/([^\/]+)$/)[1]
  const jobDescriptionId = jobData.jobDescriptionId

  const profileEvaluation = await evaluateProfileApi(
    profileId,
    jobDescriptionId,
    profileData,
    jobData.jobDescription
  )
  console.log("api response", profileEvaluation)
  await saveDataToIndexedDB({
    projectId: jobData.projectId,
    jobDescriptionId: jobData.jobDescriptionId,
    profileId: profileData.personal.id,
    evaluation: profileEvaluation,
    evaluationRating: -1
  })
  notifyContentScript(ActionTypes.ITEM_ADDED)

  console.log("ITEM ADDED TO INDEXEDDB, ", currentJob, jobId)

  // Mark the current task as complete
  if (currentJob && currentJob.jobId === jobId) {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      console.log("MARK TASK AS COMPLETE", task)
      task.status = JobStatus.COMPLETE
    }
  }

  if (currentJob && tasks.every((item) => item.status === JobStatus.COMPLETE)) {
    currentJob.status = JobStatus.COMPLETE
  }
}

// Stop the job
function stopJob() {
  storage.set(JOB_RUNNING, false)
  chrome.tabs.remove(workingTabId, function () {
    currentJob = null
    tasks = []
    workingTabId = null
    console.log("tab closed")
  })
}

export { }
