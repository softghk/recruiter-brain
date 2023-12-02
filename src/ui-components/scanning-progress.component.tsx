import CloseIcon from "@mui/icons-material/Close"
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  styled,
  Typography
} from "@mui/material"
import React, { useEffect, useState } from "react"

const StyledCloseIcon = styled(CloseIcon)(({}) => ({
  width: 20,
  height: 20,
  color: "white"
}))

const ScanningProgress = ({
  onPause,
  onStop,
  onClose
}: {
  onPause?: any
  onStop?: any
  onClose?: any
}) => {
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    // Content script to check job status every second
    const intervalId = setInterval(() => {
      chrome.runtime.sendMessage({ action: "get-status" }, (response) => {
        console.log("Current job status:", response)
        const tasks = response.tasks
        setTotal(tasks.length)
        const completedTasks = tasks.filter(
          (task) => task.status === "complete"
        ).length
        setCompleted(completedTasks)
        if (completedTasks === tasks.length) clearInterval(intervalId)
      })
    }, 1000)
  }, [])

  return (
    <Stack direction={"column"} gap={0} padding={2}>
      <Stack direction={"row"} alignItems={"center"} gap={1} width={"100%"}>
        <LinearProgress
          value={(completed / (total || 1)) * 100}
          variant="determinate"
          sx={{ width: "100%" }}
        />
        {total > 0 && completed === total ? (
          <IconButton
            size="small"
            onClick={onClose}
            style={{ background: "#bbb", width: 24, height: 24 }}>
            <StyledCloseIcon />
          </IconButton>
        ) : (
          <>
            <Button variant="contained" onClick={onPause}>
              Pause
            </Button>
            <Button variant="contained" color="error" onClick={onStop}>
              Stop
            </Button>
          </>
        )}
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
