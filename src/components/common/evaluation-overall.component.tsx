import { Box, Card, Stack, Typography } from "@mui/material"
import React from "react"

import ChartRadialBar from "~@minimal/sections/_examples/extra/chart-view/chart-radial-bar"

import EvaluationCompare from "./evaluation-compare"

const OverallView = ({ rating, percent }) => {
  return (
    <Card sx={{ height: "100%", padding: 3 }}>
      <Stack gap={3}>
        <Typography variant="subtitle2">Overall Rating</Typography>
        <Box position={"relative"} minHeight={0} maxHeight={160} marginTop={-5}>
          <ChartRadialBar series={[rating * 10]} />
          <Stack
            direction={"column"}
            position={"absolute"}
            left={56}
            bottom={14}>
            <Typography variant="h5" textAlign={"center"}>
              {rating} / 10
            </Typography>
            <Typography variant="caption" color={"gray"}>
              Candidate Rating
            </Typography>
          </Stack>
        </Box>
        <EvaluationCompare percent={percent} />
      </Stack>
    </Card>
  )
}

export default OverallView
