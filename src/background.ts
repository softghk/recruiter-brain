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
  type CandidateRating,
  type JobData,
  type Task
} from "./types"
import { evaluateProfileApi } from "./utils/api-service.utils"
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

// Current job and its tasks
let currentJob = null
let tasks = []
let workingTabId = null

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case ActionTypes.EVALUATE_PROFILES:
      handleEvaluateProfiles(request)
      break
    case ActionTypes.GET_STATUS:
      handleSendCurrentJobStatus(sendResponse)
      break
    case ActionTypes.STOP_JOB:
      handleStopJob(sendResponse)
      break
    case ActionTypes.GET_JOB_DETAILS:
      handleGetJobDetails(request, sendResponse)
      break
    case ActionTypes.CLOSE_TAB:
      handleCloseTab(sender)
      break
    case ActionTypes.CLEAR_PROJECT_DATA:
      handleProjectDataClearance(request, sendResponse)
      break
    case ActionTypes.DELETE_ALL_DATABASE:
      handleDeleteAllDatabases(sendResponse)
      break
    case ActionTypes.TASK_DATA_RECEIVED:
      handleTaskDataReceived(request)
      break
    case ActionTypes.GET_DATA_FROM_INDEXED_DB:
      handleGetDataFromIndexedDB(request, sendResponse)
      return true // Indicates asynchronous response
    case ActionTypes.UPDATE_DATA_FROM_INDEXED_DB:
      handleUpdateDataFromIndexedDB(request)
      break
    case ActionTypes.CREATE_DATABASE:
      handleCreateDatabase(sendResponse)
      break
    default:
      console.log("action handling not implemented", request.action)
      break
  }

  return true // Indicate that the response is asynchronous
})

chrome.runtime.onInstalled.addListener(function (object) {
  createDatabase()
  let externalUrl = "https://www.linkedin.com/talent/hire/"

  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: externalUrl }, function (tab) {})
  }
})

chrome.tabs.onRemoved.addListener(function (tabId, info) {
  chrome.tabs.get(tabId, function (tab) {
    if (tabId === workingTabId && currentJob?.status !== JobStatus.COMPLETE) {
      stopJob()
    }
  })
})

// BEGIN: Handle tasks received from content script
function handleEvaluateProfiles(request) {
  evaluateProfiles(request.data)
}

function handleSendCurrentJobStatus(sendResponse) {
  sendResponse({ currentJob, tasks })
}

function handleStopJob(sendResponse) {
  stopJob()
  sendResponse({ status: JobStatus.STOPPED })
}

function handleGetJobDetails(request, sendResponse) {
  storage.get(JOB_DESCRIPTION).then((response) => {
    sendResponse({ data: response })
  })
}

function handleProjectDataClearance(request, sendResponse) {
  storage.get(CANDIDATE_RATING).then((response) => {
    // @ts-ignore
    const newRating = { ...response }
    delete newRating[request.data]
    storage.set(CANDIDATE_RATING, newRating)
  })
  deleteAllFromIndexedDB({ projectId: request.data }).then((response) => {
    console.log("got response after delete db")
    sendMessageToContentScript("delete-db")
    sendResponse({ data: response })
  })
}

function handleCloseTab(sender) {
  chrome.tabs.remove(sender.tab.id, () => {})
}

function handleDeleteAllDatabases(sendResponse) {
  deleteAllDatabases().then(() => {
    console.log("got response after delete all db")
    storage.removeAll()
    sendMessageToContentScript("delete-db")
    sendMessageToContentScript("reset-all")
    sendResponse({ data: "" })
  })
}

function handleTaskDataReceived(request) {
  makeAPICallAndSaveData(request.linkedInData, {
    ...request.jobData,
    taskId: request.taskId
  })
}

function handleGetDataFromIndexedDB(request, sendResponse) {
  getDataFromIndexedDB(request.payload)
    .then((data) => sendResponse({ success: true, data }))
    .catch((error) => sendResponse({ success: true, data: null }))
  return true // Indicates asynchronous response
}

function handleUpdateDataFromIndexedDB(request) {
  const data = request.payload
  deleteDataFromIndexedDB(data).then(() => {
    saveDataToIndexedDB(data).then(() => {
      notifyContentScript(ActionTypes.ITEM_ADDED_TO_INDEXED_DB)
    })
  })
}

function handleCreateDatabase(sendResponse) {
  createDatabase().then(() => sendResponse())
}
// END: Handle tasks received from content script

function evaluateProfiles(jobData: JobData) {
  const jobId = uuidv4()
  currentJob = { ...jobData, status: JobStatus.PENDING, jobId: jobId }
  tasks = Array.from({ length: jobData.amount }, (_, i) => ({
    id: i,
    status: JobStatus.PENDING
  }))

  initiateJobProcessing({ ...jobData, jobId: jobId })
}

const initiateJobProcessing = async (jobData) => {
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
        args: [jobData]
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
async function makeAPICallAndSaveData(profileData, jobData: JobData) {
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
  notifyContentScript(ActionTypes.ITEM_ADDED_TO_INDEXED_DB)

  // @ts-ignore
  await updateCandidateRating(jobData.projectId, profileEvaluation.rating)

  markTaskAsComplete(taskId, jobId)
}

async function updateCandidateRating(projectId, newRating) {
  const rating = await storage.get(CANDIDATE_RATING)
  if (!rating)
    storage.set(CANDIDATE_RATING, {
      [projectId]: newRating
    })
  else if (!rating[projectId]) {
    // @ts-ignore
    rating[projectId] = newRating
    storage.set(CANDIDATE_RATING, rating)
  } else {
    // @ts-ignore
    const oldAvg: CandidateRating = rating[projectId]
    const newAvg: CandidateRating = {
      education: (oldAvg.education + newRating.education) / 2,
      experience: (oldAvg.experience + newRating.experience) / 2,
      skills: (oldAvg.skills + newRating.skills) / 2,
      overall: (oldAvg.overall + newRating.overall) / 2,
      // @ts-ignore
      total: (oldAvg.total + newRating.total) / 2
    }
    storage.set(CANDIDATE_RATING, { ...newRating, [projectId]: newAvg })
  }
}

// Mark the current task as complete
function markTaskAsComplete(taskId: number, jobId: number) {
  if (currentJob && currentJob.jobId === jobId) {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      task.status = JobStatus.COMPLETE
    }
  }

  if (currentJob && areAllComplete(tasks)) {
    currentJob.status = JobStatus.COMPLETE
  }
}

function areAllComplete(arr: Task[]): boolean {
  return arr.every((item) => item.status === JobStatus.COMPLETE)
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

export {}
