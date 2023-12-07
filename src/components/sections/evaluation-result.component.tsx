import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { Grid, Stack } from "@mui/material"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { AUTH_STATE, EXTENSION_ENABLE } from "src/config/storage.config"
import {
  getEvaluationData,
  rateCandidateEvaluation
} from "src/utils/api-service.utils"
import { updateDataFromIndexedDB } from "src/utils/storage.utils"

import { useStorage } from "@plasmohq/storage/hook"

import { MinimalProvider } from "~@minimal/Provider"

import EvaluationDetail from "../common/evaluation-detail.component"
import OverallView from "../common/evaluation-overall.component"
import TrendingComponent from "../common/trending.component"

const ProfileEvaluation = ({ data }: { data: any }) => {
  const { id, profileId, evaluationRating, evaluation } = data
  const { rating, explanation } = evaluation

  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const [state] = useStorage<boolean>(EXTENSION_ENABLE, true)
  const [auth] = useStorage(AUTH_STATE)

  const onRefreshEvaluation = async () => {
    setLoading(true)
    try {
      await getEvaluationData()
    } catch (error) {}
    setLoading(false)
  }

  const onChangeEvaluationRating = (e) => {
    // update indexed db
    const evaluationRating = Number(e.target.value)
    const newData = { ...data, evaluationRating }
    updateDataFromIndexedDB(newData)
    console.log("datadatadata", data)
    rateCandidateEvaluation(
      data.profileId,
      data.jobDescriptionId,
      evaluationRating
    )
  }

  if (!auth?.isAuth || !state) return null

  const expandedLayout = () => (
    <Grid container spacing={3}>
      <Grid item xs={4}>
        <Stack gap={3}>
          <TrendingComponent
            percent={10}
            rating={rating.experience}
            title={"Experience"}
          />
          <TrendingComponent
            percent={10}
            rating={rating.education}
            title={"Qualification"}
          />
          <TrendingComponent
            percent={10}
            rating={rating.skills}
            title={"Skills"}
          />
          <OverallView rating={rating} />
        </Stack>
      </Grid>
      <Grid item xs={8}>
        <EvaluationDetail
          evaluationRating={evaluationRating}
          explanation={explanation}
          onChangeEvaluationRating={onChangeEvaluationRating}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </Grid>
    </Grid>
  )

  const unexpandedLayout = () => (
    <Grid container spacing={3}>
      <Grid item xs={4}>
        <TrendingComponent
          percent={10}
          rating={rating.experience}
          title={"Experience"}
        />
      </Grid>
      <Grid item xs={4}>
        <TrendingComponent
          percent={10}
          rating={rating.education}
          title={"Qualification"}
        />
      </Grid>
      <Grid item xs={4}>
        <TrendingComponent
          percent={10}
          rating={rating.skills}
          title={"Skills"}
        />
      </Grid>
      <Grid item xs={4}>
        <OverallView rating={rating} />
      </Grid>
      <Grid item xs={8}>
        <EvaluationDetail
          evaluationRating={evaluationRating}
          explanation={explanation}
          onChangeEvaluationRating={onChangeEvaluationRating}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </Grid>
    </Grid>
  )

  return (
    <MinimalProvider>
      {expanded ? expandedLayout() : unexpandedLayout()}
    </MinimalProvider>
  )
}

const profileContainer = (profileEvaluation) => {
  const { profileId } = profileEvaluation

  const container = document.createElement("div")
  container.setAttribute("id", `recruit-brain-profile-${profileId}`)
  container.setAttribute("class", `recruit-brain-profile-evaluation`)
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
