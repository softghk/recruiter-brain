import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material"
import React from "react"
import Logo from "react:~assets/logo.svg"
import { EXTENSION_ENABLE } from "src/config/storage.config"
import useFirebaseUser from "src/firebase/useFirebaseUser"

import { useStorage } from "@plasmohq/storage/hook"

import { deleteAllDatabases } from "./utils/indexed-db.utils"

const IndexPopup = () => {
  const [state, setState] = useStorage<boolean | null>(EXTENSION_ENABLE, true)

  const { onLogout } = useFirebaseUser()

  const onReset = () => {
    chrome.runtime.sendMessage(
      { action: "delete-db-all", data: "" },
      (response) => {
        console.log("DELETE DB")
      }
    )
    // onLogout()
    // deleteAllDatabases()
    // const evaluations = document.getElementsByClassName(
    //   `recruit-brain-profile-evaluation`
    // )
    // for (let i = 0; i < evaluations.length; i++) {
    //   const element = evaluations[i]
    //   element.remove()
    // }
  }

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      width={260}
      padding={2}
      gap={2}>
      <Box>
        <Logo />
      </Box>
      <ToggleButtonGroup
        value={state}
        onChange={(e, val) => (val !== null ? setState(val) : null)}
        exclusive
        aria-label="On/Off">
        <ToggleButton
          value={true}
          aria-label="On"
          style={{ borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>
          ON
        </ToggleButton>
        <ToggleButton
          value={false}
          aria-label="Off"
          style={{ borderBottomRightRadius: 12, borderTopRightRadius: 12 }}>
          OFF
        </ToggleButton>
      </ToggleButtonGroup>
      <Button color="primary" variant="contained" onClick={onReset}>
        Reset
      </Button>
      <Typography variant="caption" display={"block"}>
        support@recruitbrain.co
      </Typography>
    </Box>
  )
}

export default IndexPopup
