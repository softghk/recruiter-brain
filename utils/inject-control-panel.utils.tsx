import ReactDOM from "react-dom"

import ProfileDataComponent from "../ui-components/sample.component"
import { waitForElement } from "./wait-for-element.utils"

export async function injectControlPanel() {
  await new Promise((resolve) => {
    waitForElement(".artdeco-tabs", resolve)
  })
  const targetElement = document.querySelector(".artdeco-tabs")

  if (targetElement) {
    const container = document.createElement("div")
    targetElement.insertAdjacentElement("afterend", container)
    ReactDOM.render(
      <ProfileDataComponent rating={"123"} explanation={"abc"} />,
      container
    )
  } else {
    console.error("Target element for injecting data not found.")
  }
}
