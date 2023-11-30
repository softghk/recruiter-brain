import { injectDataIntoDom } from "./utils/dom-manipulation.utils"
import { generateMD5 } from "./utils/hash.utils"
import { injectControlPanel } from "./utils/inject-control-panel.utils"
import { requestDataFromIndexedDB } from "./utils/storage.utils"

export {}

injectControlPanel()

async function waitForElement2(selector) {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve("")
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  })
}

async function handleMutation(mutation) {
  if (mutation.type === "attributes" && mutation.target.tagName === "LI") {
    const element = mutation.target
    const currentClass = element.getAttribute("class")
    const oldClass = mutation.oldValue

    if (
      oldClass ===
        "ember-view profile-list__occlusion-area profile-list__border-bottom" &&
      currentClass === "ember-view profile-list__border-bottom"
    ) {
      console.log("Updated <li>:", element)
      const projectId = window.location.href.match(/\/(\d+)\//)?.[1]
      const profileId = element
        .querySelector("a")
        .href.match(/profile\/(.*?)\?/)[1]
      try {
        const result = await chrome.storage.local.get(["jobDescription"])

        chrome.runtime.sendMessage(
          { action: "get-job-details" },
          async (response) => {
            const jobData = response.data?.[projectId]
            if (!jobData) return
            const jobDescription = jobData.description || ""
            const jobDescriptionId = generateMD5(jobDescription)
            console.log(
              "jobDescription",
              jobDescription,
              "jobDescriptionId",
              jobDescriptionId
            )
            await tryFetchingData(
              projectId,
              jobDescriptionId,
              profileId,
              element
            )
          }
        )
      } catch (error) {
        console.error("Error chrome.storage.local.get():", error)
      }
    }
  }
}

async function tryFetchingData(
  projectId,
  jobDescriptionId,
  profileId,
  element
) {
  const evaluationData = await requestDataFromIndexedDB(
    projectId,
    jobDescriptionId,
    profileId
  )
  console.log("tryFetchingData", evaluationData)

  if (Array.isArray(evaluationData) && evaluationData.length) {
    console.log("Evaluation data found, injecting into DOM...", element)
    injectDataIntoDom(element, { data: evaluationData[0].evaluation })
  } else {
    console.log("No evaluation data found, setting up listener...", element)
    const listenerFunction = async (message, sender, sendResponse) => {
      if (message.action === "itemAddedToIndexedDb") {
        console.log(
          "Received itemAddedToIndexedDb message. Trying to fetch data again."
        )
        const newData = await requestDataFromIndexedDB(
          projectId,
          jobDescriptionId,
          profileId
        )
        if (Array.isArray(newData) && newData.length) {
          injectDataIntoDom(element, { data: newData[0].evaluation })
          chrome.runtime.onMessage.removeListener(listenerFunction)
        }
      }
      return true
    }
    chrome.runtime.onMessage.addListener(listenerFunction)
  }
}

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

autoInject()
