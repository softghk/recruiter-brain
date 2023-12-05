import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { Button, IconButton, Stack, SvgIcon } from "@mui/material"
import { Box } from "@mui/system"
import React, { useMemo, useState } from "react"
import ReactDOM from "react-dom/client"

import { useStorage } from "@plasmohq/storage/hook"

import Iconify from "~@minimal/components/iconify"
import { MinimalProvider } from "~@minimal/Provider"
import { EXTENSION_ENABLE, JOB_DESCRIPTION } from "~src/config/storage.config"
import { JobInitialSetting, type JobSettings } from "~src/types"
import { generateMD5 } from "~src/utils/hash.utils"
import { deleteAllFromIndexedDB } from "~src/utils/indexed-db.utils"
import { waitForElement } from "~src/utils/wait-for-element.utils"

import { injectScanningProgress } from "./progress.component"
import EvaluationSettingsModal from "./sections/evaluation-settings.component"
import JDSettingsModal from "./sections/jd-settings.component"

const buttonStyle = {
  color: "#d30000",
  borderColor: "#d30000",
  borderRadius: 3,
  fontSize: "16px",
  paddingX: 1.5,
  paddingY: "2px"
}

const EvaluateComponent = () => {
  const [extensionEnabled] = useStorage(EXTENSION_ENABLE)
  const [open, setOpen] = useState({ eval: false, setting: false })

  const projectId = window.location.href.match(/\/(\d+)\//)?.[1]

  const [description, setDescription] = useStorage(JOB_DESCRIPTION)

  const currentJD: JobSettings = useMemo(
    () => description?.[projectId] || JobInitialSetting,
    [description]
  )

  const onSaveJDToStore = (data: JobSettings) => {
    if (!description) setDescription({ [projectId]: data })
    else setDescription({ ...description, [projectId]: data })
  }

  const onResetJD = () => {
    if (!description) {
      setDescription({})
    } else {
      setDescription({ ...description, [projectId]: JobInitialSetting })
    }
    deleteAllFromIndexedDB({ projectId })
    const evaluations = document.getElementsByClassName(
      `recruit-brain-profile-evaluation`
    )
    for (let i = 0; i < evaluations.length; i++) {
      const element = evaluations[i]
      element.remove()
    }
  }

  const onChangeSettings = (jd) => {
    setDescription({ ...description, [projectId]: jd })
  }

  const onEvaluate = (evaluationSettings) => {
    setOpen({ eval: false, setting: false })

    injectScanningProgress()

    const href = window.location.href

    chrome.runtime.sendMessage({
      action: "evaluate-profiles",
      data: {
        projectId: href.match(/\/(\d+)\//)?.[1],
        searchContextId: (href.match(/searchContextId=([^&]+)/) || [])[1],
        jobDescriptionId: generateMD5(evaluationSettings.description || ""),
        href: href,

        amount: evaluationSettings.searchLimit || 0,
        jobTitle: evaluationSettings.title || "",
        jobDescription: evaluationSettings.description || ""
      }
    })
  }

  if (!extensionEnabled) return <></>

  return (
    <>
      <JDSettingsModal
        data={currentJD}
        open={open.eval}
        onClose={() => setOpen({ ...open, eval: false })}
        onFinish={onSaveJDToStore}
        onReset={onResetJD}
      />
      <EvaluationSettingsModal
        data={currentJD}
        open={open.setting}
        onEvaluate={onEvaluate}
        onChange={onChangeSettings}
        onClose={() => setOpen({ ...open, setting: false })}
        onChangeJD={() => setOpen({ eval: true, setting: false })}
      />
      {currentJD.title === "" || currentJD.description === "" ? (
        <Button
          sx={{
            marginTop: -1,
            marginLeft: -1,
            marginRight: 1,
            color: "#d30000",
            borderColor: "#d30000",
            borderRadius: 3,
            fontSize: "16px",
            paddingX: 1.5,
            paddingY: "2px"
          }}
          variant="outlined"
          onClick={() => setOpen({ eval: true, setting: false })}
          endIcon={
            <SvgIcon>
              <svg
                style={{ width: 20, height: 20 }}
                width="29"
                height="29"
                viewBox="0 0 29 29"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15.6448 1.90649H13.3551V6.48593H15.6448V1.90649ZM19.0794 1.90649H16.7897V6.48593H19.0794V1.90649ZM12.2102 1.90649H9.92051V6.48593H12.2102V1.90649ZM13.3551 27.0934H15.6448V22.514H13.3551V27.0934ZM16.7897 27.0934H19.0794V22.514H16.7897V27.0934ZM9.92051 27.0934H12.2102V22.514H9.92051V27.0934ZM22.514 15.6448H27.0934V13.3551H22.514V15.6448ZM22.514 19.0794H27.0934V16.7897H22.514V19.0794ZM22.514 9.92051V12.2102H27.0934V9.92051H22.514ZM1.90649 15.6448H6.48593V13.3551H1.90649V15.6448ZM1.90649 19.0794H6.48593V16.7897H1.90649V19.0794ZM1.90649 12.2102H6.48593V9.92051H1.90649V12.2102ZM8.77565 20.2243H20.2243V8.77565H8.77565V20.2243ZM11.0654 11.0654H17.9345V17.9345H11.0654V11.0654Z"
                  fill="#d30000"
                />
              </svg>
            </SvgIcon>
          }>
          Activate RecruiterBrain
        </Button>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            marginTop: -1,
            marginLeft: -1,
            marginRight: 1
          }}>
          <Button
            variant="outlined"
            sx={buttonStyle}
            onClick={() => setOpen({ eval: false, setting: true })}>
            Evaluate Profiles
          </Button>
          <Button
            variant="outlined"
            sx={buttonStyle}
            onClick={() => setOpen({ eval: true, setting: false })}>
            <Iconify icon={"material-symbols:settings"} />
          </Button>
        </Box>
      )}
    </>
  )
}

export const insertEvaluationComponent = async () => {
  const querySelectorTargetElement = ".sourcing-channels__post-job-link"
  const injectComponentId = "recruit-brain-injector"
  await new Promise((resolve) => {
    waitForElement(querySelectorTargetElement, resolve)
  })

  const targetElement = document.querySelector(querySelectorTargetElement)
  const injectComponent = document.getElementById(injectComponentId)

  if (targetElement && !injectComponent) {
    const container = document.createElement("div")
    container.setAttribute("id", injectComponentId)
    targetElement.after(container)
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
        <MinimalProvider>
          <EvaluateComponent />
        </MinimalProvider>
      </CacheProvider>
    )
  }
}

export default EvaluateComponent
