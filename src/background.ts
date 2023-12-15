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
import { calculateAverageRatings } from "./utils/average.util"
import {
  createDatabase,
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

chrome.runtime.onMessage.addListener(handleMessage)
chrome.runtime.onInstalled.addListener(handleInstalled)
chrome.tabs.onRemoved.addListener(handleTabRemoved)

const actionHandlers = {
  [ActionTypes.EVALUATE_PROFILES]: handleEvaluateProfiles,
  [ActionTypes.GET_STATUS]: handleSendCurrentJobStatus,
  [ActionTypes.STOP_JOB]: handleStopJob,
  [ActionTypes.GET_JOB_DETAILS]: handleGetJobDetails,
  [ActionTypes.CLOSE_TAB]: handleCloseTab,
  [ActionTypes.CLEAR_PROJECT_DATA]: handleProjectDataClearance,
  [ActionTypes.DELETE_ALL_DATABASE]: handleDeleteAllDatabases,
  [ActionTypes.TASK_DATA_RECEIVED]: handleTaskDataReceived,
  [ActionTypes.GET_EVALUATION_FROM_INDEXED_DB]:
    handleGetEvaluationFromIndexedDB,
  [ActionTypes.UPDATE_DATA_FROM_INDEXED_DB]: handleUpdateDataFromIndexedDB,
  [ActionTypes.GET_EVALUATIONS_AVERAGE_FROM_INDEXED_DB]:
    handleGetEvaluationsAverageFromIndexedDB,
  [ActionTypes.CREATE_DATABASE]: handleCreateDatabase
}
async function handleMessage(request, sender, sendResponse) {
  const handler = actionHandlers[request.action]
  if (handler) {
    await handler(request, sender, sendResponse)
  } else {
    console.log("action handling not implemented", request.action)
  }
  return true
}

function handleInstalled(object) {
  createDatabase()
  const externalUrl = "https://www.linkedin.com/talent/hire/"
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: externalUrl }, function (tab) {})
  }
}

function handleTabRemoved(tabId, info) {
  chrome.tabs.get(tabId, async function (tab) {
    if (tabId === workingTabId && currentJob?.status !== JobStatus.COMPLETE) {
      await stopJob()
    }
  })
}

// BEGIN: Handle tasks received from content script
function handleEvaluateProfiles(request, sender, sendResponse) {
  evaluateProfiles(request.data)
}

function handleSendCurrentJobStatus(request, sender, sendResponse) {
  sendResponse({ currentJob, tasks })
}

function handleStopJob(request, sender, sendResponse) {
  stopJob()
  sendResponse({ status: JobStatus.STOPPED })
}

function handleGetJobDetails(request, sender, sendResponse) {
  storage.get(JOB_DESCRIPTION).then((response) => {
    sendResponse({ data: response })
  })
}

function handleProjectDataClearance(request, sender, sendResponse) {
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

function handleCloseTab(request, sender, sendResponse) {
  chrome.tabs.remove(sender.tab.id, () => {})
}

function handleDeleteAllDatabases(request, sender, sendResponse) {
  deleteAllDatabases().then(() => {
    console.log("got response after delete all db")
    storage.removeAll()
    sendMessageToContentScript("delete-db")
    sendMessageToContentScript("reset-all")
    sendResponse({ data: "" })
  })
}

function handleTaskDataReceived(request, sender, sendResponse) {
  makeAPICallAndSaveData(request.linkedInData, {
    ...request.jobData,
    taskId: request.taskId
  })
}

function handleGetEvaluationFromIndexedDB(request, sender, sendResponse) {
  getEvaluationFromIndexedDB(request.payload)
    .then((data) => sendResponse({ success: true, data }))
    .catch((error) => sendResponse({ success: true, data: null }))
  return true // Indicates asynchronous response
}

function handleUpdateDataFromIndexedDB(request, sender, sendResponse) {
  const data = request.payload
  deleteDataFromIndexedDB(data).then(() => {
    saveDataToIndexedDB(data).then(() => {
      notifyContentScript(ActionTypes.ITEM_ADDED_TO_INDEXED_DB)
    })
  })
}

async function handleGetEvaluationsAverageFromIndexedDB(
  request,
  sender,
  sendResponse
) {
  const { projectId, jobDescriptionId } = request.payload
  const evaluations = await getEvaluationsFromIndexedDB({
    projectId,
    jobDescriptionId
  })
  const averages = calculateAverageRatings(evaluations)
  sendResponse({ success: true, data: averages })
}

function handleCreateDatabase(request, sender, sendResponse) {
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

async function initiateJobProcessing(jobData) {
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

  markTaskAsComplete(taskId, jobId)
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
