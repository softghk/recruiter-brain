import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { Box, Grid, Stack } from "@mui/material"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import {
  AUTH_STATE,
  CANDIDATE_RATING,
  EXTENSION_ENABLE
} from "src/config/storage.config"
import {
  getEvaluationData,
  rateCandidateEvaluation
} from "src/utils/api-service.utils"
import { updateDataFromIndexedDB } from "src/utils/storage.utils"

import { useStorage } from "@plasmohq/storage/hook"

import { MinimalProvider } from "~@minimal/Provider"
import { CandidateInitialRating } from "~src/types"

import EvaluationDetail from "../common/evaluation-detail.component"
import OverallView from "../common/evaluation-overall.component"
import TrendingComponent from "../common/trending.component"

const ProfileEvaluation = ({ data }: { data: any }) => {
  const { id, profileId, projectId, evaluationRating, evaluation } = data
  const { rating, explanation } = evaluation

  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const [state] = useStorage<boolean>(EXTENSION_ENABLE, true)
  const [avgRatings] = useStorage(CANDIDATE_RATING)
  const averageRating = avgRatings?.[projectId] || CandidateInitialRating
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

  const unexpandedLayout = () => (
    <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} maxWidth={900}>
      <Grid item lg={4} xs={12} sm={4} md={12}>
        <TrendingComponent
          percent={
            (rating.experience - averageRating.experience) *
            (100 / rating.experience)
          }
          rating={rating.experience}
          title={"Experience"}
          weight={40}
        />
      </Grid>
      <Grid item lg={4} xs={12} sm={4} md={12}>
        <TrendingComponent
          percent={
            (rating.education - averageRating.education) *
            (100 / rating.education)
          }
          rating={rating.education}
          title={"Qualification"}
          weight={20}
        />
      </Grid>
      <Grid item lg={4} xs={12} sm={4} md={12}>
        <TrendingComponent
          percent={
            (rating.skills - averageRating.skills) * (100 / rating.skills)
          }
          rating={rating.skills}
          title={"Skills"}
          weight={40}
        />
      </Grid>
      <Grid item lg={4} xs={12} sm={4} md={12}>
        <OverallView
          rating={rating.overall}
          percent={
            (rating.overall - averageRating.overall) * (100 / rating.overall)
          }
        />
      </Grid>
      <Grid item lg={8} xs={12} sm={8} md={12}>
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
      {/* {expanded ? expandedLayout() : unexpandedLayout()} */}
      {unexpandedLayout()}
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

  const globalStyleContainer = document.createElement("style")
  globalStyleContainer.textContent = `
    .row__top-section {
      flex-direction: column !important;
    }
  `

  document.head.appendChild(globalStyleContainer)

  return container
}

export default profileContainer
