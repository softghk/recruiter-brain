import { Card, LinearProgress, Stack, Typography } from "@mui/material"
import React from "react"

import EvaluationCompare from "./evaluation-compare"

const TrendingComponent = ({ title, rating, percent }) => {
  return (
    <Card sx={{ padding: 3 }}>
      <Stack gap={2}>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="subtitle2">{title}</Typography>
          <Stack direction={"row"}>
            <Typography variant="subtitle2">{rating} / 10</Typography>
            <Typography variant="body2" color={"gray"}>
              ({rating * 10}%)
            </Typography>
          </Stack>
        </Stack>
        <LinearProgress
          value={rating * 10}
          variant="determinate"
          sx={{ width: "100%" }}
        />
        <EvaluationCompare percent={percent} />
      </Stack>
    </Card>
  )
}

export default TrendingComponent
