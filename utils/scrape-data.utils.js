import { extractLinkedInData } from "./extract-linkedin-data.utils"
import { waitForElement } from "./wait-for-element.utils"

export async function scrapeData() {
  console.log("start scraping")

  // Check if the key elements for data extraction are already present
  const isDataReady = document.querySelector(".your-data-element-selector") // Replace with an actual selector that indicates data readiness

  if (!isDataReady) {
    // If data isn't ready, wait for the essential element
    await new Promise((resolve) => {
      waitForElement(".component-card.background-card", resolve)
    })

    // Check for the expand button and click if necessary
    var button = document.querySelector(
      "button.artdeco-button--muted.artdeco-button--icon-right[data-test-expandable-button]"
    )
    if (button) {
      button.click()
      // Short delay to allow for DOM updates after the click
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return extractLinkedInData()
}
