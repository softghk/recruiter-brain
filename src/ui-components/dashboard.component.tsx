import { Stack, Grid, Button } from '@mui/material'
import React from 'react'
import EcommerceSalesOverview from '~@minimal/sections/overview/e-commerce/ecommerce-sales-overview'
import useFirebaseUser from '~src/firebase/useFirebaseUser'

export const DashboardComponent = () => {

  const { onLogout } = useFirebaseUser()

  const data = [{
    label: 'PROFILES EVALUATED',
    totalAmount: 300,
    value: 75
  }, {
    label: 'MESSAGES SEND',
    totalAmount: 50,
    value: 12
  },]

  return (
    <Stack spacing={2}>
      <Grid container width={800} spacing={2}>
        <Grid item xs={6}>
          <EcommerceSalesOverview data={data} title='Daily Usage Stats' />
        </Grid>
        <Grid item xs={6}>
          <EcommerceSalesOverview data={data} title='Daily Usage Stats' />
        </Grid>
      </Grid>
      <Stack direction={'row'} justifyContent={'flex-end'}>
        <Button color='primary' onClick={onLogout}>Sign Out</Button>
      </Stack>
    </Stack>
  )
}
