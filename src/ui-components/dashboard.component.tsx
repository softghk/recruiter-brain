import EcommerceSalesOverview from "@minimal/sections/overview/e-commerce/ecommerce-sales-overview"
import { Button, Grid, Stack } from "@mui/material"
import React, { useEffect, useState } from "react"
import { EXTENSION_VISIBLE } from "src/config/storage.config"
import useFirebaseUser from "src/firebase/useFirebaseUser"
import { getStatisticData } from "src/utils/api-service.utils"

import { useStorage } from "@plasmohq/storage/hook"

export const DashboardComponent = () => {
  const { onLogout } = useFirebaseUser()
  const [visible] = useStorage(EXTENSION_VISIBLE)
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
    if (!visible) return
    getStatisticData().then((response: any) => {
      console.log("response", response)
      setData(response)
    })
  }, [visible])

  return (
    <Stack spacing={2}>
      <Grid container width={800} spacing={2}>
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
