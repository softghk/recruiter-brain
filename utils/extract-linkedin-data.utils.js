export function extractLinkedInData() {
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
      el.querySelector(".grouped-position-entity__metadata-container") !== null
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
