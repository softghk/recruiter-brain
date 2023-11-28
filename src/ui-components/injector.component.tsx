import React, { useEffect } from 'react'
import useFirebaseUser from '~src/firebase/useFirebaseUser'
import SampleComponent from './sample.component'
import ReactDOM from 'react-dom/client'

import simpleBarStyle from 'data-text:simplebar-react/dist/simplebar.min.css';
import mapboxStyle from 'data-text:mapbox-gl/dist/mapbox-gl.css';
import quillStyle from 'data-text:react-quill/dist/quill.snow.css';
import carouselStyle from 'data-text:slick-carousel/slick/slick.css';
import carouselThemeStyle from 'data-text:slick-carousel/slick/slick-theme.css';
import lazyStyle from 'data-text:react-lazy-load-image-component/src/effects/blur.css';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useStorage } from '@plasmohq/storage/hook'
import { EXTENSION_ENABLE } from '~src/config/storage.config';
import { waitForElement } from '~src/utils/wait-for-element.utils';

const InjectorComponent = () => {

  const { user } = useFirebaseUser()
  const [enabled] = useStorage(EXTENSION_ENABLE)

  useEffect(() => {
    const inject = async () => {
      const injectComponentId = 'recruit-brain-injector'
      const querySelectorTargetElement = ".artdeco-tabs"

      await new Promise((resolve) => {
        waitForElement(querySelectorTargetElement, resolve)
      })

      const targetElement = document.querySelector(querySelectorTargetElement)
      const injectedComponent = document.getElementById(injectComponentId)

      if (!user || !enabled) {
        injectedComponent && injectedComponent.remove()
        return
      }


      if (targetElement && !injectedComponent) {
        const container = document.createElement("div")
        container.setAttribute('id', 'recruit-brain-injector')
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
    inject()
  }, [user, enabled])


  return null
}

export default InjectorComponent