import { Box, Card, Stack, Typography } from "@mui/material"
import React from "react"

import ChartRadialBar from "~@minimal/sections/_examples/extra/chart-view/chart-radial-bar"

import EvaluationCompare from "./evaluation-compare"

const OverallView = ({ rating, percent }) => {
  return (
    <Card sx={{ height: "100%", padding: 3 }}>
      <Stack gap={3}>
        <Typography variant="subtitle2">Overall Rating</Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%"
          }}>
          <Box
            position={"relative"}
            sx={{
              marginTop: -5,
              maxHeight: 160,
              minHeight: 0,
              scale: {
                md: "1",
                xs: "0.8"
              }
            }}>
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
        </Box>
        <EvaluationCompare percent={percent} />
      </Stack>
    </Card>
  )
}

export default OverallView
