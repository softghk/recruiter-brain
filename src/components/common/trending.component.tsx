import { Card, Stack, Typography } from "@mui/material"
import LinearProgress, {
  linearProgressClasses
} from "@mui/material/LinearProgress"
import { styled } from "@mui/material/styles"
import React from "react"

import EvaluationCompare from "./evaluation-compare"

const CustomLinearProgress = styled(LinearProgress)(({ theme }) => ({
  [`& .${linearProgressClasses.bar}`]: {
    backgroundColor: "#22C55E"
  }
}))

const TrendingComponent = ({ title, rating, percent }) => {
  return (
    <Card sx={{ padding: 3 }}>
      <Stack gap={2}>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="subtitle2">{title}</Typography>
          <Stack direction={"row"} gap={0.5}>
            <Typography variant="subtitle2">{rating} / 10</Typography>
            <Typography variant="body2" color={"gray"}>
              ({rating * 10}%)
            </Typography>
          </Stack>
        </Stack>
        <CustomLinearProgress
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
