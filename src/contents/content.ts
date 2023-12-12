import type { PlasmoCSConfig } from "plasmo"
import { auth } from "src/firebase/firebaseClient"

import { Storage } from "@plasmohq/storage"

import { insertEvaluationComponent } from "../components/evaluation"
import { injectMainComponent } from "../components/main"
import { injectScanningProgress } from "../components/progress.component"
import { CANDIDATE_RATING, JOB_RUNNING } from "../config/storage.config"
import {
  htmlClassInvisibleProfile,
  htmlClassVisibleProfile
} from "../utils/constants.utils"
import { injectDataIntoDom } from "../utils/dom-manipulation.utils"
import { generateMD5 } from "../utils/hash.utils"
import { requestDataFromIndexedDB } from "../utils/storage.utils"
import { waitForElement2 } from "../utils/wait-for-element.utils"

const storage = new Storage()

export {}

storage.get(CANDIDATE_RATING).then((response) => {
  console.log("CANDIDATE_RATING", response)
})

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/talent/hire/*"]
}

injectEvaluationResults()

let mainObserver = null
let previousURL = ""

const injectComponents = () => {
  if (mainObserver) mainObserver.disconnect()

  const targetNode = document.getElementsByTagName("body")[0]

  const config = { attributes: false, childList: true, subtree: true }

  const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList" || mutation.type === "subtree") {
        const currentURL = window.location.href
        if (currentURL !== previousURL) {
          console.log("URL changed to:", currentURL)
          previousURL = currentURL
          storage.get(JOB_RUNNING).then((isRunning) => {
            console.log("IS JOB RUNNING: ", isRunning)
            if (isRunning) injectScanningProgress()
          })
          injectMainComponent()
          insertEvaluationComponent({
            querySelectorTargetElement: ".sourcing-channels__post-job-link",
            position: "after"
          })
          insertEvaluationComponent({
            querySelectorTargetElement: ".candidate-filtering-bar__container",
            position: "appendChild",
            style: { marginTop: 0, marginLeft: 1 }
          })
          injectEvaluationResults()
        }
      } else if (mutation.type === "attributes") {
        console.log(`The ${mutation.attributeName} attribute was modified.`)
      }
    }
  }

  mainObserver = new MutationObserver(callback)
  mainObserver.observe(targetNode, config)
}

injectComponents()

async function injectEvaluationResults() {
  const listElementSelector = "ol.profile-list"
  const parentSelector = ".page-layout__workspace"

  let listObserver = null // Variable to store the current observer for the list

  // Function to observe the OL element
  const observeListElement = () => {
    if (listObserver) {
      listObserver.disconnect() // Disconnect any existing observer
      console.log("Previous list observer disconnected.")
    }

    const olElement = document.querySelector(listElementSelector)
    if (!olElement) {
      console.warn("OL element not found:", listElementSelector)
      return
    }

    listObserver = new MutationObserver((mutations) =>
      mutations.forEach(handleMutation)
    )

    listObserver.observe(olElement, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
      subtree: true
    })
    console.log("OL element observer connected.")
  }

  // Observe the parent element for the addition or removal of the OL element
  const parentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        const hasOlElement = Array.from(mutation.addedNodes)
          .concat(Array.from(mutation.removedNodes))
          .some(
            (node) =>
              node instanceof Element &&
              node.matches &&
              node.matches(listElementSelector)
          )

        if (hasOlElement) {
          observeListElement()
        }
      }
    })
  })

  // Wait for the parent element before setting up the observer
  await waitForElement2(parentSelector)
  const parentElement = document.querySelector(parentSelector)
  if (!parentElement) {
    console.error("Parent element not found:", parentSelector)
    return
  }

  parentObserver.observe(parentElement, { childList: true, subtree: true })

  // Initial observation of the OL element
  await waitForElement2(listElementSelector)
  console.log("Initial OL is available")
  observeListElement()
}

const getJobData = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "get-job-details" }, (response) => {
      if (response.data) {
        resolve(response.data)
      } else {
        reject("No data found for job details")
      }
    })
  })
}

async function handleMutation(mutation) {
  if (mutation.type === "attributes" && mutation.target.tagName === "LI") {
    const element = mutation.target
    const currentClass = element.getAttribute("class")
    const oldClass = mutation.oldValue

    const getElements = () => mutation.target

    const isOldClassInvisible = oldClass === htmlClassInvisibleProfile
    const isCurrentClassVisible = currentClass === htmlClassVisibleProfile
    const isProfileVisible = isOldClassInvisible && isCurrentClassVisible

    if (isProfileVisible) {
      try {
        const projectId = window.location.href.match(/\/(\d+)\//)?.[1]
        const profileId = element
          .querySelector("a")
          .href.match(/profile\/(.*?)\?/)[1]
        const jobData: any = await getJobData()

        if (!jobData?.[projectId]) return
        const jobDescription = jobData?.[projectId].description || ""
        const jobDescriptionId = generateMD5(jobDescription)

        const evaluationData = await getEvaluationData(
          projectId,
          jobDescriptionId,
          profileId
        )

        if (Array.isArray(evaluationData) && evaluationData.length) {
          console.log(
            "Evaluation data found, injecting into DOM...",
            evaluationData[0].profileId
          )
          injectDataIntoDom(element, evaluationData[0])
        } else {
          console.log(
            "No evaluation data found, setting up listener...",
            element
          )
          const listenerFunction = async (message, sender, sendResponse) => {
            if (message.action === "itemAddedToIndexedDb") {
              const jobData: any = await getJobData()
              const projectId = window.location.href.match(/\/(\d+)\//)?.[1]
              const jobDescription = jobData?.[projectId].description || ""
              const jobDescriptionId = generateMD5(jobDescription)

              const newData = await requestDataFromIndexedDB(
                projectId,
                jobDescriptionId,
                profileId
              )
              if (Array.isArray(newData) && newData.length) {
                console.log("INJECT DATA INTO DOM")
                injectDataIntoDom(getElements(), newData[0])
                chrome.runtime.onMessage.removeListener(listenerFunction)
              }
            }
            sendResponse()
          }
          chrome.runtime.onMessage.addListener(listenerFunction)
        }
      } catch (error) {
        // console.error("Error get-job-details from backgrounds script:", error)
      }
    }
  }
}

async function getEvaluationData(projectId, jobDescriptionId, profileId) {
  return new Promise(async (resolve, reject) => {
    try {
      const evaluationData = await requestDataFromIndexedDB(
        projectId,
        jobDescriptionId,
        profileId
      )
      resolve(evaluationData)
    } catch (error) {
      console.error("Error fetching data from indexedDB:", error)
      reject(error)
    }
  })
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    case "reset-all":
      auth.signOut()
      break
    case "delete-db":
      console.log("delete db from background")
      const evaluations = document.getElementsByClassName(
        `recruit-brain-profile-evaluation`
      )
      for (let i = 0; i < evaluations.length; i++) {
        const element = evaluations[i]
        element.remove()
      }
      window.location.reload()
      sendResponse()
      break
    default:
      sendResponse()
      break
  }
  if (request.action) {
    console.log("content.js received message:", request.action)
  }
})
