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

export {}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action) {
    console.log("content.js received message:", request.action)
  }
  return true
})

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
      console.log("tryFetchingData", evaluationData)
      resolve(evaluationData)
    } catch (error) {
      console.error("Error fetching data from indexedDB:", error)
      reject(error)
    }
  })
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

//injectControlPanel()

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

// const targetElement = document.querySelector(".artdeco-entity-lockup")
// if (targetElement)
//   targetElement.after(
//     buildDataHTML(
//       8.2,
//       `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. At auctor urna nunc id cursus metus aliquam eleifend. Sagittis vitae et leo duis ut diam quam nulla. Praesent elementum facilisis leo vel. Neque sodales ut etiam sit amet nisl purus. Sed ullamcorper morbi tincidunt ornare massa. Integer eget aliquet nibh praesent tristique magna sit amet purus. Pharetra sit amet aliquam id diam maecenas ultricies mi eget. Amet volutpat consequat mauris nunc congue. Ac turpis egestas integer eget aliquet nibh praesent. A erat nam at lectus urna duis convallis convallis. Sapien nec sagittis aliquam malesuada bibendum arcu. Id consectetur purus ut faucibus. Maecenas pharetra convallis posuere morbi leo urna molestie at elementum. Augue neque gravida in fermentum et sollicitudin ac orci. Gravida dictum fusce ut placerat orci. Magna fermentum iaculis eu non. Ornare quam viverra orci sagittis eu volutpat odio facilisis. Leo vel fringilla est ullamcorper. Sit amet consectetur adipiscing elit ut aliquam purus sit amet.

//   Nullam non nisi est sit. Sodales ut eu sem integer vitae justo. Est pellentesque elit ullamcorper dignissim. Id velit ut tortor pretium viverra suspendisse potenti. Malesuada pellentesque elit eget gravida cum. At imperdiet dui accumsan sit amet. Ornare massa eget egestas purus viverra accumsan. Dolor sit amet consectetur adipiscing elit duis. At augue eget arcu dictum varius duis at consectetur. Est velit egestas dui id ornare arcu. Cursus vitae congue mauris rhoncus aenean. Porta lorem mollis aliquam ut porttitor leo a diam sollicitudin. Nibh praesent tristique magna sit amet purus gravida quis blandit. Amet venenatis urna cursus eget nunc scelerisque. Vel turpis nunc eget lorem dolor sed viverra ipsum nunc. Aliquam ultrices sagittis orci a scelerisque. Risus sed vulputate odio ut.

//   Sollicitudin ac orci phasellus egestas tellus rutrum tellus pellentesque eu. Volutpat commodo sed egestas egestas. Vestibulum lectus mauris ultrices eros in. Quis auctor elit sed vulputate mi sit amet. In nisl nisi scelerisque eu ultrices. Non blandit massa enim nec dui nunc mattis. Vulputate sapien nec sagittis aliquam malesuada bibendum arcu vitae. Et netus et malesuada fames ac turpis egestas. Quisque egestas diam in arcu cursus euismod quis viverra. Lectus vestibulum mattis ullamcorper velit. Id velit ut tortor pretium viverra suspendisse potenti. Suspendisse in est ante in. Et odio pellentesque diam volutpat commodo sed egestas. Varius quam quisque id diam vel quam elementum pulvinar. Quis ipsum suspendisse ultrices gravida dictum fusce ut placerat. In fermentum et sollicitudin ac orci phasellus.

//   Facilisis leo vel fringilla est ullamcorper eget nulla facilisi etiam. Ullamcorper a lacus vestibulum sed arcu non. Ut placerat orci nulla pellentesque. In eu mi bibendum neque. Nibh mauris cursus mattis molestie a iaculis at erat. Facilisi morbi tempus iaculis urna id volutpat lacus laoreet. Magna fringilla urna porttitor rhoncus. Egestas sed sed risus pretium quam vulputate dignissim suspendisse in. Nec dui nunc mattis enim ut tellus. Libero justo laoreet sit amet cursus sit amet dictum. Interdum posuere lorem ipsum dolor sit.

//   Sem et tortor consequat id porta nibh venenatis cras. Pellentesque elit ullamcorper dignissim cras tincidunt. Cum sociis natoque penatibus et magnis dis parturient. Nibh mauris cursus mattis molestie. Dui faucibus in ornare quam viverra orci sagittis eu volutpat. Vel fringilla est ullamcorper eget nulla facilisi etiam. Lacinia at quis risus sed. Id leo in vitae turpis massa sed. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien. Justo laoreet sit amet cursus sit amet dictum sit amet. Etiam sit amet nisl purus in mollis nunc. Mauris ultrices eros in cursus turpis. Enim diam vulputate ut pharetra sit amet aliquam id diam. Blandit aliquam etiam erat velit scelerisque. Diam sollicitudin tempor id eu nisl nunc mi ipsum. Leo in vitae turpis massa sed elementum tempus. Justo laoreet sit amet cursus sit amet.
// `,
//       "110921684"
//     )
//   )
