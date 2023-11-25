import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import ReactDOM from "react-dom/client"

import SampleComponent from "../ui-components/sample.component"
import { waitForElement } from "../utils/wait-for-element.utils"

import simpleBarStyle from 'data-text:simplebar-react/dist/simplebar.min.css';
import mapboxStyle from 'data-text:mapbox-gl/dist/mapbox-gl.css';
import quillStyle from 'data-text:react-quill/dist/quill.snow.css';
import carouselStyle from 'data-text:slick-carousel/slick/slick.css';
import carouselThemeStyle from 'data-text:slick-carousel/slick/slick-theme.css';
import lazyStyle from 'data-text:react-lazy-load-image-component/src/effects/blur.css';


export async function injectControlPanel() {
  const querySelectorTargetElement = ".artdeco-tabs"
  await new Promise((resolve) => {
    waitForElement(querySelectorTargetElement, resolve)
  })
  const targetElement = document.querySelector(querySelectorTargetElement)

  if (targetElement) {
    const container = document.createElement("div")
    targetElement.appendChild(container)
    const shadowContainer = container.attachShadow({ mode: "open" })

    const emotionRoot = document.createElement("style")
    const elementCSS = document.createElement('style')
    elementCSS.textContent = carouselStyle + carouselThemeStyle + quillStyle + lazyStyle + simpleBarStyle + mapboxStyle
    const shadowRootElement = document.createElement("div")
    shadowContainer.appendChild(emotionRoot)
    shadowContainer.appendChild(elementCSS)
    shadowContainer.appendChild(shadowRootElement)

    const cache = createCache({
      key: "css",
      prepend: true,
      container: emotionRoot
    })

    const root = ReactDOM.createRoot(shadowRootElement as HTMLElement)

    root.render(
      <CacheProvider value={cache}>
        <SampleComponent />
      </CacheProvider>
    )
  } else {
    console.error("Target element for injecting data not found.")
  }
}
