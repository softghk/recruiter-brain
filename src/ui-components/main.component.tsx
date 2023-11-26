import { useStorage } from '@plasmohq/storage/hook'
import 'src/utils/firebase-service.utils'
import React, { useState } from "react"

import { MinimalProvider } from '@minimal/Provider'
import FabButton from "./fab-button.component"
import { EXTENSION_ENABLE, EXTENSION_VISIBLE } from '~src/config/storage.config'
import { Box, Modal, IconButton, Stack } from '@mui/material'
import Login from './login.component'
import CloseIcon from '@mui/icons-material/Close'
import Logo from 'react:~assets/logo.svg'
import { DashboardComponent } from './dashboard.component'
import useFirebaseUser from 'src/firebase/useFirebaseUser'
import LoadingComponent from './loading.component'
import InjectorComponent from './injector.component'


export default function SampleComponent() {

  const [extensionEnabled] = useStorage(EXTENSION_ENABLE)
  const [extensionVisible, setExtensionVisible] = useStorage(EXTENSION_VISIBLE, true)

  const { user, isLoading } = useFirebaseUser()

  if (!extensionEnabled)
    return <InjectorComponent />

  return (
    <MinimalProvider>
      <InjectorComponent />
      <Modal open={extensionVisible} disablePortal>
        <Box sx={{
          padding: 4,
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          boxShadow: 24,
          top: '50%',
          left: '50%',
          borderRadius: 2
        }}>
          {/* Render Modal Header */}
          <Stack direction={'row'} justifyContent={'space-between'} sx={{ mb: 5 }}>
            <Logo />
            <IconButton size='small' onClick={() => setExtensionVisible(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Render Content */}
          {isLoading && <LoadingComponent />}
          {!user && !isLoading && <Login />}
          {user && !isLoading && <DashboardComponent />}

        </Box>
      </Modal>
      <FabButton sx={{ position: 'fixed', bottom: 20, right: 20 }} onClick={() => setExtensionVisible(true)} />
    </MinimalProvider>
  )
}
