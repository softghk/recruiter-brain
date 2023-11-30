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

import { MinimalProvider } from "~@minimal/Provider"
import { AUTH_STATE, EXTENSION_ENABLE } from "~src/config/storage.config"
import useFirebaseUser from "~src/firebase/useFirebaseUser"
import type { AuthState } from "~src/types"
import { waitForElement } from "~src/utils/wait-for-element.utils"

const InjectorComponent = ({
  injectComponentId,
  querySelectorTargetElement,
  direction = "child",
  children
}: {
  injectComponentId: string
  querySelectorTargetElement: string
  direction?: string
  children: any
}) => {
  const { user } = useFirebaseUser()
  const [enabled] = useStorage(EXTENSION_ENABLE)
  const [auth] = useStorage<AuthState>(AUTH_STATE)

  const useReactPath = () => {
    const [path, setPath] = React.useState(window.location.pathname)
    const listenToPopstate = () => {
      const winPath = window.location.pathname
      setPath(winPath)
    }
    React.useEffect(() => {
      window.addEventListener("popstate", listenToPopstate)
      return () => {
        window.removeEventListener("popstate", listenToPopstate)
      }
    }, [])
    return path
  }

  const path = useReactPath()

  useEffect(() => {
    const inject = async () => {
      await new Promise((resolve) => {
        waitForElement(querySelectorTargetElement, resolve)
      })

      const targetElement = document.querySelector(querySelectorTargetElement)
      const injectedComponent = document.getElementById(injectComponentId)

      if (!auth?.isAuth || !enabled) {
        injectedComponent && injectedComponent.remove()
        return
      }

      if (targetElement && !injectedComponent) {
        const container = document.createElement("div")
        container.setAttribute("id", injectComponentId)

        if (direction === "after") targetElement.after(container)
        else if (direction === "prepend") targetElement.prepend(container)
        else targetElement.appendChild(container)

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
            <MinimalProvider>{children}</MinimalProvider>
          </CacheProvider>
        )
      } else {
        console.error(
          `Target element for ${injectComponentId} injecting data not found.`
        )
      }
    }
    inject()
  }, [user, enabled, injectComponentId, querySelectorTargetElement, path])

  return null
}

export default InjectorComponent
