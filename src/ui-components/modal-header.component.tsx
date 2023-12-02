import CloseIcon from "@mui/icons-material/Close"
import { IconButton, styled, SvgIcon } from "@mui/material"
import { Stack } from "@mui/system"
import React from "react"
import Logo from "react:~assets/logo.svg"

const StyledCloseIcon = styled(CloseIcon)(({}) => ({
  width: 12,
  height: 12,
  color: "white"
}))

const ModalHeaderComponent = ({ onClose }: { onClose?: any }) => {
  return (
    <Stack
      direction={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}>
      <Logo />
      <IconButton
        size="small"
        onClick={onClose}
        style={{ background: "#bbb", width: 24, height: 24 }}>
        <StyledCloseIcon />
      </IconButton>
    </Stack>
  )
}

export default ModalHeaderComponent
