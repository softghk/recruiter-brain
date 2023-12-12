import { addOverlay } from "~src/utils/add-overlay"

async function scrapingCode(jobData) {
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
    return new Promise<void>((resolve) => {
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
          ?.innerText.trim(),
        companyLink: ""
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

    const personal: any = {}
    const positions = []
    const skills = []
    const education = []

    // Extract personal information
    const personalElement = document?.querySelector(
      ".artdeco-entity-lockup__content.lockup__content.ember-view"
    )
    personal.name = (
      personalElement?.querySelector(
        ".artdeco-entity-lockup__title.ember-view"
      ) as HTMLElement
    )?.innerText
    personal.currentPosition = (
      personalElement?.querySelector(
        ".artdeco-entity-lockup__subtitle.ember-view > span"
      ) as HTMLElement
    )?.innerText

    const locationElement = document?.querySelector(
      "div[data-test-row-lockup-location][data-live-test-row-lockup-location]"
    ) as HTMLElement // Type assertion to HTMLElement

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
    console.log("extracting data===============")

    const skillElements = document.querySelectorAll(".skill-entity__wrapper")
    skillElements.forEach((el) => {
      const skillName = (
        el.querySelector(".skill-entity__skill-name") as HTMLElement
      )?.innerText.trim()
      skills.push(skillName)
    })
    console.log("extracting data===============2")

    const educationElements = document.querySelectorAll(
      ".background-entity.education-item"
    )

    if (educationElements) {
      educationElements.forEach((el) => {
        const schoolName = (
          el.querySelector(
            "[data-test-education-entity-school-name]"
          ) as HTMLElement
        )?.innerText.trim()
        const degreeName = (
          el.querySelector(
            "[data-test-education-entity-degree-name]"
          ) as HTMLElement
        )?.innerText.trim()
        const fieldOfStudy = (
          el.querySelector(
            "[data-test-education-entity-field-of-study]"
          ) as HTMLElement
        )?.innerText.trim()
        const dates = (
          el.querySelector("[data-test-education-entity-dates]") as HTMLElement
        )?.innerText.trim()

        education.push({
          schoolName: schoolName,
          degreeName: degreeName,
          fieldOfStudy: fieldOfStudy,
          dates: dates
        })
      })
    }
    console.log("extracting data===============3")

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
  const profileLink = document.querySelector(
    "a[data-live-test-link-to-profile-link]"
  )
  if (profileLink) {
    profileLink.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    )
  }

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
    await waitForElement2(".experience-card")
    console.timeEnd("Step1Time")

    // Find all buttons with 'data-test-expandable-button' attribute and click each one
    console.log("clicking buttons more")
    console.time("Step2Time")
    await waitForElement2("button[data-test-expandable-button]")
    var buttons = document.querySelectorAll(
      "button[data-test-expandable-button]"
    )
    buttons.forEach((button) => {
      ;(button as HTMLButtonElement).click()
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
    const nextButton = document.querySelector(
      "a[data-test-pagination-next]"
    ) as HTMLAnchorElement
    nextButton.click()
    await waitForContainerChanges(".profile__container")
    await waitForElement2("[data-test-expandable-list-title]")
    console.timeEnd("Step4Time")
    console.timeEnd("CompleteTime")
    console.log("run end")
  }
  console.timeEnd("CompleteJobTime")
  chrome.runtime.sendMessage({
    action: "close-tab"
  })
}

if (window["isScraping"]) {
  const jobData = window["jobData"]
  scrapingCode(jobData)
}
