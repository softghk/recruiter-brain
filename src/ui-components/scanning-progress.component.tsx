import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material"
import React, { useEffect, useState } from "react"

const ScanningProgress = ({
  onPause,
  onStop
}: {
  onPause?: any
  onStop?: any
}) => {
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    // Content script to check job status every second
    setInterval(() => {
      chrome.runtime.sendMessage({ action: "get-status" }, (response) => {
        console.log("Current job status:", response)
        const tasks = response.tasks
        setTotal(tasks.length)
        setCompleted(tasks.filter((item) => item.status === "complete").length)
      })
    }, 1000)
  }, [])

  return (
    <Stack direction={"column"} gap={1} padding={2}>
      <Stack direction={"row"} alignItems={"center"} gap={1} width={"100%"}>
        <LinearProgress
          value={(completed / (total || 1)) * 100}
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
        <Typography variant="caption">
          {completed} of {total} profiles evaluated.
        </Typography>
      </Box>
    </Stack>
  )
}

export default ScanningProgress
