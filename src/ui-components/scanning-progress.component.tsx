import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material"
import React from "react"

import { MinimalProvider } from "~@minimal/Provider"

const ScanningProgress = ({
  onPause,
  onStop
}: {
  onPause?: any
  onStop?: any
}) => {
  return (
    <Stack direction={"column"} gap={1}>
      <Stack direction={"row"} alignItems={"center"} gap={1} width={"100%"}>
        <LinearProgress
          value={15}
          variant="determinate"
          sx={{ width: "100%" }}
        />
        <Button variant="contained" onClick={onPause}>
          Pause
        </Button>
        <Button variant="contained" color="error" onClick={onStop}>
          Stop
        </Button>
      </Stack>
      <Box>
        <Typography variant="caption">8 of 25 profiles evaluated.</Typography>
      </Box>
    </Stack>
  )
}

export default ScanningProgress
