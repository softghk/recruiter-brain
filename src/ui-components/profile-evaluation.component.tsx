import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import ReplayIcon from "@mui/icons-material/Replay"
import {
  Box,
  Card,
  CircularProgress,
  IconButton,
  Rating,
  Stack,
  Typography
} from "@mui/material"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"

import { useStorage } from "@plasmohq/storage/hook"

import Iconify from "~@minimal/components/iconify"
import { MinimalProvider } from "~@minimal/Provider"
import ChartRadialBar from "~@minimal/sections/_examples/extra/chart-view/chart-radial-bar"
import { AUTH_STATE, EXTENSION_ENABLE } from "~src/config/storage.config"
import useFirebaseUser from "~src/firebase/useFirebaseUser"
import { getEvaluationData } from "~src/utils/api-service.utils"
import { updateDataFromIndexedDB } from "~src/utils/storage.utils"

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

const ProfileEvaluation = ({ data }: { data: any }) => {
  const { id, profileId, likes, evaluation } = data
  const { rating, explanation } = evaluation

  const [expanded, setExpanded] = useState(false)
  const [state] = useStorage<boolean>(EXTENSION_ENABLE)

  const { user } = useFirebaseUser()
  const [auth] = useStorage(AUTH_STATE)
  const formattedExplanation = explanation.replace(/\n/g, "<br>")

  const [loading, setLoading] = useState(false)

  const onRefreshEvaluation = async () => {
    setLoading(true)
    try {
      await getEvaluationData()
    } catch (error) {}
    setLoading(false)
  }

  const onChangeLikes = (e) => {
    // update indexed db
    const newData = { ...data, likes: e.target.value }
    updateDataFromIndexedDB(newData)
  }

  if (!user || !auth?.isAuth || !state) return null

  return (
    <MinimalProvider>
      <Card
        elevation={8}
        sx={{
          paddingY: 5,
          paddingX: 3,
          marginTop: 2,
          width: "100%"
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
          <Stack gap={1}>
            <Typography variant="h6">Profile Strength Indicator</Typography>
            <Typography
              variant="body2"
              dangerouslySetInnerHTML={{ __html: formattedExplanation }}
              sx={{
                display: expanded ? "block" : "-webkit-box",
                "-webkit-box-orient": "vertical",
                "-webkit-line-clamp": "3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexGrow: 1
              }}
            />
            <Typography
              variant="body2"
              onClick={() => setExpanded(!expanded)}
              sx={{
                textDecoration: "underline",
                cursor: "pointer"
              }}>
              {expanded ? "Show Less" : "Show More"}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          direction={"row"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          gap={2}>
          <Rating
            name="customized-icons"
            defaultValue={likes}
            onChange={onChangeLikes}
            getLabelText={(ratingValue) => customIcons[ratingValue].label}
            IconContainerComponent={IconContainer}
          />
          <IconButton
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
          </IconButton>
        </Stack>
      </Card>
    </MinimalProvider>
  )
}

const profileContainer = (profileEvaluation) => {
  const { profileId } = profileEvaluation

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
      <ProfileEvaluation data={profileEvaluation} />
    </CacheProvider>
  )

  return container
}

export default profileContainer
