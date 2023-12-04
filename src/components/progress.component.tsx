import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import CloseIcon from "@mui/icons-material/Close"
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  styled,
  Typography
} from "@mui/material"
import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

import { MinimalProvider } from "~@minimal/Provider"
import { waitForElement } from "~src/utils/wait-for-element.utils"

const StyledCloseIcon = styled(CloseIcon)(({}) => ({
  width: 20,
  height: 20,
  color: "white"
}))

const ScanningProgress = ({
  onPause,
  onStop,
  onClose
}: {
  onPause?: any
  onStop?: any
  onClose?: any
}) => {
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    // Content script to check job status every second
    const intervalId = setInterval(() => {
      chrome.runtime.sendMessage({ action: "get-status" }, (response) => {
        console.log("Current job status:", response)
        const tasks = response.tasks
        setTotal(tasks.length)
        const completedTasks = tasks.filter(
          (task) => task.status === "complete"
        ).length
        setCompleted(completedTasks)
        if (completedTasks === tasks.length) clearInterval(intervalId)
      })
    }, 1000)
  }, [])

  return (
    <Stack direction={"column"} gap={0} padding={2}>
      <Stack direction={"row"} alignItems={"center"} gap={1} width={"100%"}>
        <LinearProgress
          value={(completed / (total || 1)) * 100}
          variant="determinate"
          sx={{ width: "100%" }}
        />
        {total > 0 && completed === total ? (
          <IconButton
            size="small"
            onClick={onClose}
            style={{ background: "#bbb", width: 24, height: 24 }}>
            <StyledCloseIcon />
          </IconButton>
        ) : (
          <>
            <Button variant="contained" onClick={onPause}>
              Pause
            </Button>
            <Button variant="contained" color="error" onClick={onStop}>
              Stop
            </Button>
          </>
        )}
      </Stack>
      <Box>
        <Typography variant="caption">
          {completed} of {total} profiles evaluated.
        </Typography>
      </Box>
    </Stack>
  )
}

export const injectScanningProgress = async () => {
  const querySelectorTargetElement = ".page-layout__workspace"
  const injectComponentId = "recruiter-brain-progress"
  await new Promise((resolve) => {
    waitForElement(querySelectorTargetElement, resolve)
  })

  const targetElement = document.querySelector(querySelectorTargetElement)
  const injectComponent = document.getElementById(injectComponentId)

  console.log("targetElement, injectComponent", targetElement, injectComponent)

  if (targetElement && !injectComponent) {
    const container = document.createElement("div")
    container.setAttribute("id", injectComponentId)
    targetElement.prepend(container)
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

    const removeProgress = () => {
      const element = document.getElementById(injectComponentId)
      if (element) element.remove()
    }

    root.render(
      <CacheProvider value={cache}>
        <MinimalProvider>
          <ScanningProgress onClose={removeProgress} />
        </MinimalProvider>
      </CacheProvider>
    )
  }
}

export const removeScanningProgress = () => {
  const injectComponentId = "recruiter-brain-progress"
  const element = document.getElementById(injectComponentId)
  if (element) element.remove()
}

export default ScanningProgress
