import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import ReplayIcon from "@mui/icons-material/Replay"
import { Box, Card, IconButton, Rating, Stack, Typography } from "@mui/material"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"

import { useStorage } from "@plasmohq/storage/hook"

import Iconify from "~@minimal/components/iconify"
import { MinimalProvider } from "~@minimal/Provider"
import ChartRadialBar from "~@minimal/sections/_examples/extra/chart-view/chart-radial-bar"
import { EXTENSION_ENABLE } from "~src/config/storage.config"

const customIcons: {
  [index: string]: {
    icon: React.ReactElement
    label: string
  }
} = {
  1: {
    icon: <Iconify icon="ic:round-sentiment-very-dissatisfied" />,
    label: "Very Dissatisfied"
  },
  2: {
    icon: <Iconify icon="ic:round-sentiment-dissatisfied" />,
    label: "Dissatisfied"
  },
  3: {
    icon: <Iconify icon="ic:round-sentiment-neutral" />,
    label: "Neutral"
  },
  4: {
    icon: <Iconify icon="ic:round-sentiment-satisfied" />,
    label: "Satisfied"
  },
  5: {
    icon: <Iconify icon="ic:round-sentiment-very-satisfied" />,
    label: "Very Satisfied"
  }
}

function IconContainer(props: any) {
  const { value, ...other } = props

  return <span {...other}>{customIcons[value].icon}</span>
}

const ProfileEvaluation = ({
  rating,
  explanation
}: {
  rating: number
  explanation: string
}) => {
  const [expanded, setExpanded] = useState(false)
  const [state] = useStorage<boolean>(EXTENSION_ENABLE)

  const formattedExplanation = explanation.replace(/\n/g, "<br>")

  if (!state) return null

  return (
    <MinimalProvider>
      <Card elevation={8} sx={{ paddingY: 5, paddingX: 3 }}>
        <img
          src="https://i.ibb.co/MVCGgq2/logo.png"
          alt="Logo"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 43,
            height: "auto"
          }}
        />

        <Stack direction={"row"} gap={2}>
          <Box
            position={"relative"}
            minHeight={0}
            maxHeight={160}
            marginTop={-5}>
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
          <Stack>
            <Typography variant="h6">Profile Strength Indicator</Typography>
            <Box gap={1}>
              <Typography
                variant="body2"
                dangerouslySetInnerHTML={{ __html: formattedExplanation }}
                sx={{
                  display: expanded ? "block" : "-webkit-box",
                  "-webkit-box-orient": "vertical",
                  "-webkit-line-clamp": "3",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              />
              <Stack direction={"row"} gap={1}>
                <Typography
                  variant="body2"
                  onClick={() => setExpanded(!expanded)}
                  sx={{ textDecoration: "underline", cursor: "pointer" }}>
                  {expanded ? "Show Less" : "Show More"}
                </Typography>
                <Rating
                  name="customized-icons"
                  defaultValue={2}
                  getLabelText={(ratingValue) => customIcons[ratingValue].label}
                  IconContainerComponent={IconContainer}
                />
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <Stack direction={"row"} justifyContent={"flex-end"}>
          <IconButton
            size="small"
            style={{
              background: "#EDEFF2",
              width: 24,
              height: 24
            }}>
            <ReplayIcon sx={{ fontSize: 16, color: "black" }} />
          </IconButton>
        </Stack>
      </Card>
    </MinimalProvider>
  )
}

const profileContainer = (rating, explanation, profileId) => {
  const container = document.createElement("div")
  container.setAttribute("id", `recruit-brain-profile-${profileId}`)
  const shadowContainer = container.attachShadow({ mode: "open" })
  const shadowRootElement = document.createElement("div")

  const emotionRoot = document.createElement("style")

  shadowContainer.appendChild(shadowRootElement)
  shadowContainer.appendChild(emotionRoot)

  const cache = createCache({
    key: "css",
    prepend: true,
    container: emotionRoot
  })

  const root = ReactDOM.createRoot(shadowRootElement as HTMLElement)

  root.render(
    <CacheProvider value={cache}>
      <ProfileEvaluation rating={rating} explanation={explanation} />
    </CacheProvider>
  )

  return container
}

export default profileContainer
