import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import useFirebaseUser from "src/firebase/useFirebaseUser"

import { useStorage } from "@plasmohq/storage/hook"

import { MinimalProvider } from "~@minimal/Provider"
import { EXTENSION_ENABLE, EXTENSION_VISIBLE } from "~src/config/storage.config"
import { waitForElement } from "~src/utils/wait-for-element.utils"

import FabButton from "./common/fab-button.component"
import LoadingComponent from "./common/loading.component"
import Modal from "./common/modal.component"
import Login from "./sections/login.component"
import DashboardComponent from "./sections/statistics.component"

const Home = () => {
  const [extensionEnabled] = useStorage(EXTENSION_ENABLE)
  const [extensionVisible, setExtensionVisible] = useStorage(
    EXTENSION_VISIBLE,
    true
  )

  const toggleModal = () => setExtensionVisible(!extensionVisible)

  const { user, isLoading } = useFirebaseUser()

  if (!extensionEnabled) return <></>

  return (
    <MinimalProvider>
      <Modal open={extensionVisible} onClose={toggleModal}>
        {isLoading && <LoadingComponent />}
        {!user && !isLoading && <Login />}
        {user && !isLoading && <DashboardComponent />}
      </Modal>
      <FabButton
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 10000,
          padding: 1.25
        }}
        onClick={toggleModal}
      />
    </MinimalProvider>
  )
}

export const injectMainComponent = async () => {
  const querySelectorTargetElement = "body"
  const injectComponentId = "recruitbrain-main-component"
  await new Promise((resolve) => {
    waitForElement(querySelectorTargetElement, resolve)
  })

  const targetElement = document.querySelector(querySelectorTargetElement)
  const injectComponent = document.getElementById(injectComponentId)

  if (targetElement && !injectComponent) {
    const container = document.createElement("div")
    container.setAttribute("id", injectComponentId)
    targetElement.appendChild(container)
    const shadowContainer = container.attachShadow({ mode: "open" })

    const emotionRoot = document.createElement("style")
    const shadowRootElement = document.createElement("div")
    shadowContainer.appendChild(emotionRoot)
    shadowContainer.appendChild(shadowRootElement)
    const root = ReactDOM.createRoot(shadowRootElement)

    const cache = createCache({
      key: "css",
      prepend: true,
      container: emotionRoot
    })

    root.render(
      <CacheProvider value={cache}>
        <Home />
      </CacheProvider>
    )
  }
}

export default Home
