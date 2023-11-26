import { useStorage } from '@plasmohq/storage/hook'
import 'src/utils/firebase-service.utils'
import React, { useState } from "react"

import { MinimalProvider } from '@minimal/Provider'
import FabButton from "./fab-button.component"
import { EXTENSION_ENABLE, EXTENSION_VISIBLE } from '~src/config/storage.config'
import { Box, Modal, IconButton, Stack, styled } from '@mui/material'
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
          padding: 2,
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          boxShadow: 24,
          top: '50%',
          left: '50%',
          borderRadius: 2
        }}>
          {/* Render Modal Header */}
          <Stack
            direction={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
            sx={{ mb: 5 }}
          >
            <Logo />
            <IconButton
              size='small'
              onClick={() => setExtensionVisible(false)}
              style={{ background: '#bbb', width: 27, height: 27 }}
            >
              <CloseIcon style={{ color: 'white' }} fontSize='small' />
            </IconButton>
          </Stack>

          {/* Render Content */}
          {isLoading && <LoadingComponent />}
          {!user && !isLoading && <Login />}
          {user && !isLoading && <DashboardComponent />}

        </Box>
      </Modal>
      <FabButton
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10000, padding: 1.25 }}
        onClick={() => setExtensionVisible(!extensionVisible)}
      />
    </MinimalProvider>
  )
}
