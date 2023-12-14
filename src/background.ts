// @ts-nocheck
import { v4 as uuidv4 } from "uuid"

import { Storage } from "@plasmohq/storage"

import { evaluateProfileApi } from "~utils/api-service.utils"

import {
  CANDIDATE_RATING,
  JOB_DESCRIPTION,
  JOB_RUNNING
} from "./config/storage.config"
import { ActionTypes, JobStatus, type CandidateRating } from "./types"
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
      evaluateProfiles(request.data)
      break
    case ActionTypes.GET_STATUS:
      sendResponse({ currentJob, tasks })
      break
    case ActionTypes.STOP_JOB:
      stopJob()
      sendResponse({ status: JobStatus.STOPPED })
      break
    case ActionTypes.GET_JOB_DETAILS:
      storage.get(JOB_DESCRIPTION).then((response) => {
        sendResponse({ data: response })
      })
      break
    case ActionTypes.CLOSE_TAB:
      chrome.tabs.remove(sender.tab.id, () => {})
      break
    case ActionTypes.CLEAR_PROJECT_DATA:
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

  if (request.action === "getDataFromIndexedDB") {
    console.log("RECEIVED REQUEST: getDataFromIndexedDB")
    getDataFromIndexedDB(request.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: true, data: null }))
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

function injectedCode(jobData) {
  console.log("injected code 2")
  window.jobData = jobData
  window.isScraping = true
}

const evaluateProfiles = (jobData) => {
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
        function: injectedCode,
        args: [jobData]
      })

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.done) {
          chrome.tabs.update(currentActiveTab.id, { active: true })
        }
      })
    }
  } catch (error) {
    console.error("Error in initiateJobProcessing:", error)
  }
}

// Mock API call with a timeout, then save data to IndexedDB
const makeAPICallAndSaveData = async (profileData, jobData) => {
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
  saveDataToIndexedDB({
    projectId: jobData.projectId,
    jobDescriptionId: jobData.jobDescriptionId,
    profileId: profileData.personal.id,
    evaluation: profileEvaluation,
    evaluationRating: -1
  }).then(async () => {
    notifyContentScript("itemAddedToIndexedDb")

    // shitty code & approach
    const rating = await storage.get(CANDIDATE_RATING)
    if (!rating)
      storage.set(CANDIDATE_RATING, {
        [jobData.projectId]: profileEvaluation.rating
      })
    else if (!rating[jobData.projectId]) {
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

export {}
