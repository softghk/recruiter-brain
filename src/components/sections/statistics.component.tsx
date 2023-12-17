import LoadingComponent from "../common/loading.component"
import EcommerceSalesOverview from "@minimal/sections/overview/e-commerce/ecommerce-sales-overview"
import { Button, Grid, Stack } from "@mui/material"
import React, { useEffect, useState } from "react"
import { AUTH_STATE, EXTENSION_VISIBLE } from "src/config/storage.config"
import useFirebaseUser from "src/firebase/useFirebaseUser"
import { getStatisticData } from "src/utils/api-service.utils"

import { useStorage } from "@plasmohq/storage/hook"

import type { AuthState } from "~src/types"

const DashboardComponent = () => {
  const { user, onLogout } = useFirebaseUser()
  const [visible] = useStorage(EXTENSION_VISIBLE, true)
  const [auth] = useStorage<AuthState>(AUTH_STATE)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([
    {
      label: "PROFILES EVALUATED",
      totalAmount: -1,
      value: -1
    },
    {
      label: "MESSAGES SEND",
      totalAmount: -1,
      value: -1
    }
  ])

  useEffect(() => {
    if (!user) return

    setLoading(true)
    user.getIdToken(true)
      .then(async (token) => {
        getStatisticData({ accessToken: token }).then((response: any) => {
          setData(response)
          setLoading(false)
        })
      })
      .catch(() => {
        setLoading(false)
      })
  }, [visible, user])

  return (
    <Stack spacing={2}>
      <Grid container width={768} spacing={2}>
        <Grid item xs={12}>
          {
            loading ? <LoadingComponent /> : (
              <EcommerceSalesOverview data={data} title="Daily Usage Stats" />
            )
          }
        </Grid>
        {/* <Grid item xs={6}>
          <EcommerceSalesOverview data={data} title="Daily Usage Stats" />
        </Grid> */}
      </Grid>
      <Stack direction={"row"} justifyContent={"flex-end"}>
        <Button color="primary" onClick={onLogout}>
          Sign Out
        </Button>
      </Stack>
    </Stack>
  )
}

export default DashboardComponent
