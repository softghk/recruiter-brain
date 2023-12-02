import { tr } from "date-fns/locale"
import buildDataHTML from "src/ui-components/profile-evaluation.component"

import {
  htmlClassInvisibleProfile,
  htmlClassVisibleProfile
} from "./utils/constants.utils"
import { injectDataIntoDom } from "./utils/dom-manipulation.utils"
import { generateMD5 } from "./utils/hash.utils"
import { injectControlPanel } from "./utils/inject-control-panel.utils"
import { requestDataFromIndexedDB } from "./utils/storage.utils"
import { waitForElement2 } from "./utils/wait-for-element.utils"

export {}

let previousURL = ""

window.addEventListener("DOMNodeInserted", function () {
  const currentURL = window.location.href
  if (currentURL !== previousURL) {
    console.log("URL changed to:", currentURL)
    previousURL = currentURL
    injectControlPanel()
    autoInject()
  }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action) {
    console.log("content.js received message:", request.action)
  }
  return true
})

async function autoInject() {
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

async function handleMutation(mutation) {
  if (mutation.type === "attributes" && mutation.target.tagName === "LI") {
    const element = mutation.target
    const currentClass = element.getAttribute("class")
    const oldClass = mutation.oldValue

    const isOldClassInvisible = oldClass === htmlClassInvisibleProfile
    const isCurrentClassVisible = currentClass === htmlClassVisibleProfile
    const isProfileVisible = isOldClassInvisible && isCurrentClassVisible

    if (isProfileVisible) {
      try {
        const projectId = window.location.href.match(/\/(\d+)\//)?.[1]
        const profileId = element
          .querySelector("a")
          .href.match(/profile\/(.*?)\?/)[1]
        const jobData: any = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: "get-job-details" },
            (response) => {
              if (response.data) {
                resolve(response.data)
              } else {
                reject("No data found for job details")
              }
            }
          )
        })

        if (!jobData?.[projectId]) return
        const jobDescription = jobData?.[projectId].description || ""
        const jobDescriptionId = generateMD5(jobDescription)

        const evaluationData = await getEvaluationData(
          projectId,
          jobDescriptionId,
          profileId
        )

        function injectDataIfAvailable(evaluationData, element) {
          if (Array.isArray(evaluationData) && evaluationData.length) {
            injectDataIntoDom(element, evaluationData[0])
          } else {
            chrome.runtime.onMessage.addListener(createDataListener(element))
          }
        }

        function createDataListener(element) {
          return async (message, sender, sendResponse) => {
            if (message.action === "itemAddedToIndexedDb") {
              const newData = await getEvaluationData(
                projectId,
                jobDescriptionId,
                profileId
              )
              if (Array.isArray(newData) && newData.length) {
                injectDataIntoDom(element, newData[0])
                chrome.runtime.onMessage.removeListener(this)
              }
            }
            return true
          }
        }

        // Usage
        injectDataIfAvailable(evaluationData, element)
      } catch (error) {
        console.error("Error get-job-details from backgrounds script:", error)
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
