import { Card, Rating, Stack, Typography } from "@mui/material"
import React, { useState } from "react"

import Iconify from "~@minimal/components/iconify"

const customIcons: {
  [index: string]: {
    icon: React.ReactElement
    label: string
  }
} = {
  1: {
    icon: <Iconify width={24} icon="ic:round-sentiment-very-dissatisfied" />,
    label: "Very Dissatisfied"
  },
  2: {
    icon: <Iconify width={24} icon="ic:round-sentiment-dissatisfied" />,
    label: "Dissatisfied"
  },
  3: {
    icon: <Iconify width={24} icon="ic:round-sentiment-neutral" />,
    label: "Neutral"
  },
  4: {
    icon: <Iconify width={24} icon="ic:round-sentiment-satisfied" />,
    label: "Satisfied"
  },
  5: {
    icon: <Iconify width={24} icon="ic:round-sentiment-very-satisfied" />,
    label: "Very Satisfied"
  }
}

function IconContainer(props: any) {
  const { value, ...other } = props

  return <span {...other}>{customIcons[value].icon}</span>
}

const EvaluationDetail = ({
  onChangeEvaluationRating,
  explanation,
  evaluationRating,
  expanded,
  setExpanded
}) => {
  const formattedExplanation = explanation.replace(/\n/g, "<br>")
  return (
    <Card
      elevation={8}
      sx={{
        paddingY: 5,
        paddingX: 3,
        width: "100%",
        height: "100%"
      }}>
      <img
        src="https://i.ibb.co/MVCGgq2/logo.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 36,
          height: "auto"
        }}
      />

      <Stack gap={1}>
        <Typography variant="h6">Profile Strength Indicator</Typography>
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: formattedExplanation }}
          sx={{
            display: expanded ? "block" : "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: "3",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flexGrow: 1
          }}
        />
        <Typography
          variant="body2"
          fontWeight={550}
          onClick={() => setExpanded(!expanded)}
          sx={{
            textDecoration: "underline",
            cursor: "pointer"
          }}>
          {expanded ? "show less" : "show more"}
        </Typography>
      </Stack>

      <Stack
        direction={"row"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        gap={2}>
        <Rating
          name="customized-icons"
          defaultValue={evaluationRating}
          onChange={onChangeEvaluationRating}
          getLabelText={(ratingValue) => customIcons[ratingValue].label}
        />
        {/* <IconButton
            onClick={onRefreshEvaluation}
            size="small"
            style={{
              background: "#EDEFF2",
              width: 24,
              height: 24
            }}>
            {loading ? (
              <CircularProgress size={16} />
            ) : (
              <ReplayIcon sx={{ fontSize: 16, color: "black" }} />
            )}
          </IconButton> */}
      </Stack>
    </Card>
  )
}

export default EvaluationDetail
