import {
  Box,
  Stack,
  SvgIcon,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material"
import React, { useState } from "react"
import Logo from "react:~assets/logo.svg"
import { EXTENSION_ENABLE } from "src/config/storage.config"

import { useStorage } from "@plasmohq/storage/hook"

const IndexPopup = () => {
  const [state, setState] = useStorage<boolean | null>(EXTENSION_ENABLE, true)

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
      <Typography variant="caption" display={"block"}>
        support@recruitbrain.co
      </Typography>
    </Box>
  )
}

export default IndexPopup
