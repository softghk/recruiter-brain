import React from 'react'
import { Box, Stack, Typography, Switch } from '@mui/material'

const IndexPopup = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: "350px",
        minHeight: "200px",
        overflow: "auto",
        backgroundColor: "white"
      }}
    >
      <Stack direction="row" spacing={0} alignItems="center">
        <Typography>Off</Typography>
        <Switch defaultChecked inputProps={{ 'aria-label': 'ant design' }} />
        <Typography>On</Typography>
      </Stack>
    </Box>
  )
}

export default IndexPopup