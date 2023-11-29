import { Button, IconButton, Stack, SvgIcon } from "@mui/material"
import { Box } from "@mui/system"
import React, { useMemo, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import Iconify from "~@minimal/components/iconify"
import { MinimalProvider } from "~@minimal/Provider"
import { JOB_DESCRIPTION } from "~src/config/storage.config"
import { JobInitialSetting, type JobSettings } from "~src/types"
import { generateMD5 } from "~src/utils/hash.utils"

import EvaluateModal from "./evaluate.modal"
import InjectorComponent from "./injector.component"
import ScanningProgress from "./scanning-progress.component"
import SettingsModal from "./settings.modal"

const EvaluateComponent = () => {
  const [open, setOpen] = useState({ eval: false, setting: false })
  const [evaluateStarted, setEvaluateStarted] = useState(false)

  const projectId = window.location.href.match(/\/(\d+)\//)?.[1]

  const [description, setDescription] = useStorage(JOB_DESCRIPTION)

  const currentJD: JobSettings = useMemo(
    () => description?.[projectId] || JobInitialSetting,
    [description]
  )

  const onSaveJDToStore = (data: JobSettings) => {
    if (!description) setDescription({ [projectId]: data })
    else setDescription({ ...description, [projectId]: data })
    chrome.storage.local.set({ jobDescription: description[projectId] })
  }

  const onResetJD = () => {
    if (!description) setDescription({})
    else {
      setDescription({ ...description, [projectId]: JobInitialSetting })
    }
  }

  const onChangeSettings = (jd) => {
    setDescription({ ...description, [projectId]: jd })
  }

  const onEvaluate = () => {
    setOpen({ eval: false, setting: false })
    console.log("Evaluation Started")

    const href = window.location.href

    chrome.runtime.sendMessage({
      action: "evaluate-profiles",
      data: {
        projectId: href.match(/\/(\d+)\//)?.[1],
        searchContextId: (href.match(/searchContextId=([^&]+)/) || [])[1],
        jobDescriptionId: generateMD5(currentJD.description || ""),
        href: href,

        amount: currentJD.searchLimit || 0,
        jobTitle: currentJD.title || "",
        jobDescription: currentJD.description || ""
      }
    })

    setEvaluateStarted(true)
  }

  const onPauseScanning = () => {
    chrome.runtime.sendMessage({ action: "pause-job" })
  }
  const onStopScanning = () => {
    chrome.runtime.sendMessage({ action: "stop-job" })
  }

  return (
    <>
      {evaluateStarted && (
        <InjectorComponent
          injectComponentId={"recruiter-brain-progress"}
          direction="prepend"
          querySelectorTargetElement={".profile-list-container"}>
          <ScanningProgress onPause={onPauseScanning} onStop={onStopScanning} />
        </InjectorComponent>
      )}
      <EvaluateModal
        data={currentJD}
        open={open.eval}
        onClose={() => setOpen({ ...open, eval: false })}
        onFinish={onSaveJDToStore}
        onReset={onResetJD}
      />
      <SettingsModal
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
            color: "#d30000",
            borderColor: "#d30000",
            borderRadius: 3,
            fontSize: "16px",
            paddingX: 1.5,
            paddingY: 0.5
          }}
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
                  fill="black"
                />
              </svg>
            </SvgIcon>
          }>
          Activate RecruiterBrain
        </Button>
      ) : (
        <Box sx={{ display: "flex", gap: 2, marginTop: -1 }}>
          <Button
            variant="outlined"
            sx={{
              color: "#d30000",
              borderColor: "#d30000",
              borderRadius: 3,
              fontSize: "16px",
              paddingX: 1.5,
              paddingY: 0.5
            }}
            onClick={() => setOpen({ eval: false, setting: true })}>
            Evaluate Profiles
          </Button>
          <Button
            variant="outlined"
            sx={{
              color: "#d30000",
              borderColor: "#d30000",
              borderRadius: 3,
              fontSize: "16px",
              paddingX: 1.5,
              paddingY: 0.5
            }}
            onClick={() => setOpen({ eval: true, setting: false })}>
            <Iconify icon={"material-symbols:settings"} />
          </Button>
        </Box>
      )}
    </>
  )
}

export default EvaluateComponent
