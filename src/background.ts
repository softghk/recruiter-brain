// @ts-nocheck
import { v4 as uuidv4 } from "uuid"

import { Storage } from "@plasmohq/storage"

import { evaluateProfileApi } from "~utils/api-service.utils"

import { JOB_DESCRIPTION } from "./config/storage.config"
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
  GET_JOB_DETAILS: "get-job-details"
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

const openTabAndInjectCode = (jobData) => {
  // Get the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
    if (activeTabs.length > 0) {
      const currentActiveTab = activeTabs[0]

      // Create a new tab as active
      chrome.tabs.create({ url: currentJob.href, active: true }, (newTab) => {
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

// Process the next task
const processNextTask = () => {
  const task = tasks.find((t) => t.status === JobStatus.PENDING)
  console.log("processNextTask", task)
  if (!task) {
    currentJob.status = JobStatus.COMPLETE
    return
  }

  task.status = JobStatus.COMPLETE

  // Mock task processing
  setTimeout(() => {
    console.log("Processing task", task.id)
    // Mock API call
    console.log("Sending mock API call with data:", {
      ...mockData,
      jobId: currentJob.projectId
    })

    setTimeout(() => {
      console.log("API call complete", currentJob.projectId)
    }, 5000)

    // Process the next task
    processNextTask()
  }, 1000)
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
  })
  markTaskAsComplete(taskId, jobId)
}

// Save data to IndexedDB
function saveDataToIndexedDB({
  projectId,
  jobDescriptionId,
  profileId,
  evaluation,
  evaluationRating
}) {
  console.log("saveDataToIndexedDB")
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  const storeName = projectId
  const dbVersion = 5 // Increment this version when changes are made to the database structure

  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName, dbVersion)

  return new Promise((resolve, reject) => {
    // Handle database upgrade
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: true
        })
      }
    }

    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      const db = event.target.result
      const tx = db.transaction(storeName, "readwrite")
      const store = tx.objectStore(storeName)
      const data = {
        projectId,
        jobDescriptionId,
        profileId,
        evaluation,
        evaluationRating
      }

      const addRequest = store.add(data)

      addRequest.onsuccess = () => {
        console.log("Data saved to IndexedDB", data)
        notifyContentScript("itemAddedToIndexedDb")
      }

      addRequest.onerror = () => {
        console.error("Error saving data to IndexedDB")
      }

      // Close the transaction
      tx.oncomplete = () => db.close()
      resolve()
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
}

async function deleteDataFromIndexedDB({ id, projectId }) {
  console.log("Delete Data from IndexedDB")
  const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
  const storeName = projectId

  // Open or create a database with an updated version
  const openRequest = indexedDB.open(dbName)

  return new Promise((resolve, reject) => {
    // Handle successful database opening
    openRequest.onsuccess = async (event) => {
      const db = event.target.result
      const tx = db.transaction(storeName, "readwrite")
      console.log("storeName", storeName)
      const store = tx.objectStore(storeName)

      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => {
        console.log("Data deleted from IndexedDB: ", id)
        resolve(id)
      }

      deleteRequest.onerror = () => {
        console.error("Error deleting data from IndexedDB")
        reject()
      }

      // Close the transaction
      tx.oncomplete = () => db.close()
    }

    // Handle errors in opening the database
    openRequest.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.errorCode)
      reject()
    }
  })
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
      // processNextTask() // Process the next task, if any
    }
  }

  if (areAllComplete(tasks)) {
    currentJob.status = JobStatus.COMPLETE
  }

  function areAllComplete(arr) {
    return arr.every((item) => item.status === "complete")
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
    const logoSrc = "https://i.ibb.co/f4B31Pg/logo-light.png" // Replace with your logo image

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
    textDiv.style.fontSize = "24px"
    textDiv.style.color = "#333" // Customize text color
    textDiv.style.marginTop = "20px" // Add spacing above the text
    textDiv.textContent = "Please wait..."

    // Append the logo and textDiv to the content container
    contentContainer.appendChild(logo)
    contentContainer.appendChild(textDiv)

    // Append the content container to the overlay
    overlay.appendChild(contentContainer)

    // Append the overlay to the body of the page
    document.body.appendChild(overlay)
  }
  function extractLinkedInData() {
    function extractPositionDetails(positionElement) {
      const positionDetails = {
        title: positionElement
          .querySelector(
            "[data-test-position-entity-title], [data-test-grouped-position-entity-title]"
          )
          ?.innerText.trim(),
        company: positionElement
          .querySelector("[data-test-position-entity-company-name]")
          ?.innerText.trim(),
        dateRange: positionElement
          .querySelector(
            "[data-test-position-entity-date-range], [data-test-grouped-position-entity-date-range]"
          )
          ?.innerText.trim(),
        location: positionElement
          .querySelector(
            "[data-test-position-entity-location], [data-test-grouped-position-entity-location]"
          )
          ?.innerText.trim(),
        duration: positionElement
          .querySelector(
            "[data-test-position-entity-duration], [data-test-grouped-position-entity-duration]"
          )
          ?.innerText.trim(),
        description: positionElement
          .querySelector(
            "[data-test-position-entity-description], [data-test-grouped-position-entity-description]"
          )
          ?.innerText.trim(),
        employmentStatus: positionElement
          .querySelector(
            "[data-test-position-entity-employment-status], [data-test-grouped-position-entity-employment-status]"
          )
          ?.innerText.trim(),
        positionSkills: positionElement
          .querySelector(".position-skills-entity")
          ?.innerText.trim()
        // positionSkills: positionElement
        //   .querySelectorAll(".position-skills-entity")
        //   ?.innerText.trim()
      }

      return positionDetails
    }

    function extractGroupedCompanyInfo(groupedElement) {
      const companyInfo = {
        company: groupedElement
          .querySelector("[data-test-grouped-position-entity-company-name]")
          ?.innerText.trim(),
        companyLink: groupedElement
          .querySelector("[data-test-grouped-position-entity-company-link]")
          ?.getAttribute("href")
      }

      return companyInfo
    }

    const personal = {}
    const positions = []
    const skills = []
    const education = []

    // Extract personal information
    const personalElement = document.querySelector(
      ".artdeco-entity-lockup__content.lockup__content.ember-view"
    )
    personal.name = personalElement.querySelector(
      ".artdeco-entity-lockup__title.ember-view"
    ).innerText
    personal.currentPosition = personalElement.querySelector(
      ".artdeco-entity-lockup__subtitle.ember-view > span"
    ).innerText
    const locationElement = document.querySelector(
      "div[data-test-row-lockup-location][data-live-test-row-lockup-location]"
    )
    personal.location = locationElement.innerText.trim().replace(/·\s*/, "")

    personal.id = window.location.href.match(/profile\/(.*?)\?/)[1]
    personal.url = window.location.href.split("?")[0]

    // Extract positions
    const positionElements = document.querySelectorAll(
      ".expandable-list-profile-core__list artdeco-list > li, .expandable-list-profile-core__list-item"
    )

    positionElements.forEach((el) => {
      const isGrouped =
        el.querySelector(".grouped-position-entity__metadata-container") !==
        null
      if (isGrouped) {
        const companyInfo = extractGroupedCompanyInfo(el)
        const groupedPositions = el.querySelectorAll(
          ".grouped-position-entity__metadata-container"
        )
        groupedPositions.forEach((groupEl) => {
          const positionDetails = extractPositionDetails(groupEl)
          positionDetails.company = companyInfo.company
          positionDetails.companyLink = companyInfo.companyLink
          positions.push(positionDetails)
        })
      } else {
        positions.push(extractPositionDetails(el))
      }
    })

    const skillElements = document.querySelectorAll(".skill-entity__wrapper")
    skillElements.forEach((el) => {
      const skillName = el
        .querySelector(".skill-entity__skill-name")
        ?.innerText.trim()
      skills.push(skillName)
    })

    const educationElements = document.querySelectorAll(
      ".background-entity.education-item"
    )
    educationElements.forEach((el) => {
      const schoolName = el
        .querySelector("[data-test-education-entity-school-name]")
        ?.innerText.trim()
      const degreeName = el
        .querySelector("[data-test-education-entity-degree-name]")
        ?.innerText.trim()
      const fieldOfStudy = el
        .querySelector("[data-test-education-entity-field-of-study]")
        ?.innerText.trim()
      const dates = el
        .querySelector("[data-test-education-entity-dates]")
        ?.innerText.trim()

      education.push({
        schoolName: schoolName,
        degreeName: degreeName,
        fieldOfStudy: fieldOfStudy,
        dates: dates
      })
    })

    return {
      personal: personal,
      positions: positions,
      skills: skills,
      education: education
    }
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
    await waitForElement2(".background-card")
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
    await new Promise((resolve) => setTimeout(resolve, 100))

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
    await waitForElement2(".expandable-list-profile-core__title")
    console.timeEnd("Step4Time")
    console.timeEnd("CompleteTime")
    console.log("run end")
  }
  console.timeEnd("CompleteJobTime")
}

// Mock data for API call
const mockData = {
  profileName: "John Doe",
  experience: "5 years",
  skills: ["JavaScript", "React"]
}

// Pause the job
const pauseJob = () => {
  if (currentJob) {
    currentJob.status = JobStatus.PAUSED
  }
}

// Resume the job
const resumeJob = () => {
  if (currentJob && currentJob.status === JobStatus.PAUSED) {
    currentJob.status = JobStatus.PENDING
    processNextTask()
  }
}

// Stop the job
const stopJob = () => {
  if (currentJob) {
    currentJob.status = JobStatus.FAILED
    tasks.forEach((task) => {
      if (task.status === JobStatus.PENDING) {
        task.status = JobStatus.FAILED
      }
    })
  }
}

// Retrieve data from plasmohq storage

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
    case ActionTypes.PAUSE_JOB:
      pauseJob()
      sendResponse({ status: "Job paused" })
      break
    case ActionTypes.RESUME_JOB:
      resumeJob()
      sendResponse({ status: "Job resumed" })
      break
    case ActionTypes.STOP_JOB:
      stopJob()
      sendResponse({ status: "Job stopped" })
      break
    case ActionTypes.GET_JOB_DETAILS:
      storage.get(JOB_DESCRIPTION).then((response) => {
        sendResponse({ data: response })
      })
  }

  if (sender.tab && request.taskId !== undefined) {
    makeAPICallAndSaveData(request.linkedInData, {
      ...request.jobData,
      taskId: request.taskId
    })
  }

  return true // Indicate that the response is asynchronous
})

// TODO: Implement persistent storage for tasks and job status

function getDataFromIndexedDB({ projectId, jobDescriptionId, profileId }) {
  return new Promise((resolve, reject) => {
    const dbName = process.env.PLASMO_PUBLIC_INDEXEDDB_DBNAME_EVALUATIONS
    const storeName = projectId

    // Open the database
    const openRequest = indexedDB.open(dbName)

    openRequest.onsuccess = (event) => {
      const db = event.target.result

      try {
        const tx = db.transaction(storeName, "readonly")
        const store = tx.objectStore(storeName)
        const request = store.getAll()

        request.onsuccess = () => {
          const data = request.result
          // Filter the data based on the criteria
          const filteredData = data.filter(
            (item) =>
              item.projectId === projectId &&
              item.jobDescriptionId === jobDescriptionId &&
              item.profileId === profileId
          )
          resolve(filteredData)
        }

        request.onerror = () => {
          reject("Error in retrieving data from IndexedDB")
        }
      } catch (error) {
        // Handle case where object store does not exist
        if (error.name === "NotFoundError") {
          resolve(null) // Return null if the store does not exist
        } else {
          reject("Transaction failed", error)
        }
      }
    }

    openRequest.onerror = (event) => {
      reject("Error opening IndexedDB", event.target.errorCode)
    }
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDataFromIndexedDB") {
    getDataFromIndexedDB(request.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error }))
    return true // Indicates asynchronous response
  }

  if (request.action === "updateDataFromIndexedDB") {
    const data = request.payload
    deleteDataFromIndexedDB(data).then(() => {
      saveDataToIndexedDB(data)
    })
  }
})
