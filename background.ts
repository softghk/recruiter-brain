// @ts-nocheck

export {}
// Listen for a message from a content script to start the process
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "open-tab-in-background-and-scrape-profile-data") {
    openTabAndScrape(request.url)
  }

  if (request.action === "linkedInData") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0]
      chrome.tabs.sendMessage(activeTab.id, {
        action: "linkedInData",
        data: request.data
      })
    })
  }

  if (request.action === "closeTab" && sender.tab) {
    // Close the tab from which the message was sent
    console.log("closing tab")
    chrome.tabs.remove(sender.tab.id)
  }
})

function openTabAndScrape(url) {
  let isScriptInjected = false // flag to check if the script has been injected

  chrome.tabs.create({ url: url, active: false }, function (tab) {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
      if (
        tabId === tab.id &&
        changeInfo.status === "complete" &&
        !isScriptInjected
      ) {
        console.log("starting executeScript in background tab")
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrapeData
        })
        isScriptInjected = true // set the flag to true after injecting the script
      }
    })
  })
}

// scraping code

async function scrapeData() {
  function waitForElement(selector, callback) {
    // Initial check if the element is already present
    let element = document.querySelector(selector)
    if (element) {
      callback(element)
      return
    }

    // Set up the MutationObserver
    let observer = new MutationObserver(function (mutations, me) {
      let element = document.querySelector(selector)
      if (element) {
        callback(element)
        me.disconnect() // Stop observing
        return
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })
  }

  function extractLinkedInData() {
    const personal = {}
    const positions = []

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

    return {
      personal: personal,
      positions: positions
    }
  }

  function extractPositionDetails(positionElement) {
    const positionDetails = {
      title: positionElement
        .querySelector(
          "[data-test-position-entity-title], [data-test-grouped-position-entity-title]"
        )
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
      company: positionElement
        .querySelector("[data-test-position-entity-company-name]")
        ?.innerText.trim()
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

  // Check if the key elements for data extraction are already present
  const isDataReady = document.querySelector(".experience-card") // Replace with an actual selector that indicates data readiness

  if (!isDataReady) {
    // If data isn't ready, wait for the essential element
    await new Promise((resolve) => {
      console.log("start scraping waitForElement")
      waitForElement(".experience-card", resolve)
    })

    // Check for the expand button and click if necessary
    var button = document.querySelector(
      "button.artdeco-button--muted.artdeco-button--icon-right[data-test-expandable-button]"
    )
    if (button) {
      button.click()
      // Short delay to allow for DOM updates after the click
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  const linkedInData = extractLinkedInData()

  console.log("scrapeData - linkedInData", linkedInData)

  chrome.runtime.sendMessage({ action: "linkedInData", data: linkedInData })

  setTimeout(() => {
    chrome.runtime.sendMessage({ action: "closeTab" })
  }, 25)
}
