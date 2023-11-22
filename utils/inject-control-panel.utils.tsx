import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import ReactDOM from "react-dom"

import SampleComponent from "../ui-components/sample.component"
import { waitForElement } from "../utils/wait-for-element.utils"

export async function injectControlPanel() {
  await new Promise((resolve) => {
    waitForElement(".artdeco-tabs", resolve)
  })
  const targetElement = document.querySelector(".artdeco-tabs")

  if (targetElement) {
    const container = document.createElement("div")
    targetElement.appendChild(container)
    const shadowContainer = container.attachShadow({ mode: "open" })

    const emotionRoot = document.createElement("style")
    const shadowRootElement = document.createElement("div")
    shadowContainer.appendChild(emotionRoot)
    shadowContainer.appendChild(shadowRootElement)

    const cache = createCache({
      key: "css",
      prepend: true,
      container: emotionRoot
    })

    ReactDOM.render(
      <CacheProvider value={cache}>
        <SampleComponent />
      </CacheProvider>,
      shadowRootElement
    )
  } else {
    console.error("Target element for injecting data not found.")
  }
}
