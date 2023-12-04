import { useStorage } from "@plasmohq/storage/hook"

import { MinimalProvider } from "@minimal/Provider"
import CloseIcon from "@mui/icons-material/Close"
import { Box, IconButton, Modal, Stack, styled } from "@mui/material"
import React, { useState } from "react"
import Logo from "react:~assets/logo.svg"
import useFirebaseUser from "src/firebase/useFirebaseUser"

import { EXTENSION_ENABLE, EXTENSION_VISIBLE } from "~src/config/storage.config"

import { DashboardComponent } from "./dashboard.component"
import EvaluateComponent from "./evaluate.component"
import FabButton from "./fab-button.component"
import InjectorComponent from "./injector.component"
import LoadingComponent from "./loading.component"
import Login from "./login.component"

const StyledCloseIcon = styled(CloseIcon)(({ theme }) => ({
  width: 12,
  height: 12,
  color: "white"
}))

export default function SampleComponent() {
  const [extensionEnabled] = useStorage(EXTENSION_ENABLE)
  const [extensionVisible, setExtensionVisible] = useStorage(
    EXTENSION_VISIBLE,
    true
  )

  const { user, isLoading } = useFirebaseUser()

  if (!extensionEnabled)
    return (
      <InjectorComponent
        direction={"after"}
        injectComponentId={"recruit-brain-injector"}
        querySelectorTargetElement={".sourcing-channels__post-job-link"}>
        <EvaluateComponent />
      </InjectorComponent>
    )

  return (
    <MinimalProvider>
      <InjectorComponent
        direction={"after"}
        injectComponentId={"recruit-brain-injector"}
        querySelectorTargetElement={".sourcing-channels__post-job-link"}>
        <EvaluateComponent />
      </InjectorComponent>
      <Modal open={extensionVisible} disablePortal disableScrollLock>
        <Box
          sx={{
            padding: 2,
            position: "absolute",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            boxShadow: 24,
            top: "50%",
            left: "50%",
            borderRadius: 2
          }}>
          {/* Render Modal Header */}
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            sx={{ mb: 5 }}>
            <Logo />
            <IconButton
              size="small"
              onClick={() => setExtensionVisible(false)}
              style={{ background: "#bbb", width: 24, height: 24 }}>
              <StyledCloseIcon />
            </IconButton>
          </Stack>

          {/* Render Content */}
          {isLoading && <LoadingComponent />}
          {!user && !isLoading && <Login />}
          {user && !isLoading && <DashboardComponent />}
        </Box>
      </Modal>
      <FabButton
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 10000,
          padding: 1.25
        }}
        onClick={() => setExtensionVisible(!extensionVisible)}
      />
    </MinimalProvider>
  )
}
