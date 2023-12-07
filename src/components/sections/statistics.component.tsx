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
  const [visible] = useStorage(EXTENSION_VISIBLE)
  const [auth] = useStorage<AuthState>(AUTH_STATE)
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

  console.log(auth, user)
  useEffect(() => {
    if (!visible || !user || !auth?.isAuth) return
    getStatisticData().then((response: any) => {
      setData(response)
    })
  }, [visible, user, auth])

  return (
    <Stack spacing={2}>
      <Grid container width={768} spacing={2}>
        <Grid item xs={6}>
          <EcommerceSalesOverview data={data} title="Daily Usage Stats" />
        </Grid>
        <Grid item xs={6}>
          <EcommerceSalesOverview data={data} title="Daily Usage Stats" />
        </Grid>
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
