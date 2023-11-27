import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import mapboxStyle from "data-text:mapbox-gl/dist/mapbox-gl.css"
import lazyStyle from "data-text:react-lazy-load-image-component/src/effects/blur.css"
import quillStyle from "data-text:react-quill/dist/quill.snow.css"
import simpleBarStyle from "data-text:simplebar-react/dist/simplebar.min.css"
import carouselThemeStyle from "data-text:slick-carousel/slick/slick-theme.css"
import carouselStyle from "data-text:slick-carousel/slick/slick.css"
import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"

import { useStorage } from "@plasmohq/storage/hook"

import { EXTENSION_ENABLE } from "~src/config/storage.config"
import useFirebaseUser from "~src/firebase/useFirebaseUser"
import { waitForElement } from "~src/utils/wait-for-element.utils"

import SampleComponent from "./sample.component"

const InjectorComponent = () => {
  const { user } = useFirebaseUser()
  const [enabled] = useStorage(EXTENSION_ENABLE)

  useEffect(() => {
    const injectComponentId = "recruit-brain-injector"
    const querySelectorTargetElement = ".artdeco-tabs"
    const targetElement = document.querySelector(querySelectorTargetElement)
    const injectedComponent = document.getElementById(injectComponentId)

    if (!user || !enabled) {
      injectedComponent && injectedComponent.remove()
      return
    }

    if (targetElement && !injectedComponent) {
      const container = document.createElement("div")
      container.setAttribute("id", "recruit-brain-injector")
      targetElement.appendChild(container)
      const shadowContainer = container.attachShadow({ mode: "open" })

      const emotionRoot = document.createElement("style")
      const elementCSS = document.createElement("style")
      elementCSS.textContent =
        carouselStyle +
        carouselThemeStyle +
        quillStyle +
        lazyStyle +
        simpleBarStyle +
        mapboxStyle
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
  }, [user, enabled])

  return null
}

export default InjectorComponent
