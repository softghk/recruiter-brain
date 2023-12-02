import React from 'react'
import { Modal, Stack, Box, Typography, IconButton, Button } from '@mui/material'
import Iconify from '~@minimal/components/iconify'
import CloseIcon from '@mui/icons-material/Close'

const ResetJDModal = ({
  open,
  onCancel,
  onOk
}: {
  open: boolean,
  onCancel?: any,
  onOk?: any
}) => {
  return (
    <Modal
      disablePortal
      disableScrollLock
      open={open}
      sx={{ zIndex: 9999 }}
    >
      <Box
        sx={{
          padding: 3,
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          boxShadow: 24,
          top: '50%',
          left: '50%',
          borderRadius: 2,
          width: 420
        }}
      >
        <Stack gap={3}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
            <Box display={'flex'} alignItems={'center'} gap={2}>
              <Iconify width={24} icon={'mdi:trash'} />
              <Typography variant='h6'>Reset Job Description?</Typography>
            </Box>
            <IconButton onClick={onCancel}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box>
            <Typography variant='body1' color={'gray'}>
              Evaluations rely on this job description: resetting it will erase all existing evaluations.
            </Typography>
          </Box>

          <Box display={'flex'} justifyContent={'flex-end'} gap={1.5}>
            <Button variant='contained' color='error' onClick={onOk}>
              Reset Job Description
            </Button>
            <Button variant='outlined' onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  )
}

export default ResetJDModal