import { Box, Container, Stack } from "@mui/material"
import React from "react"

import BasicButtons from "./basic-buttons.component"

import { MinimalProvider } from '@minimal/Provider'
import AppFeatured from "@minimal/sections/overview/app/app-featured"
import { _appFeatured } from "@minimal/_mock"
import AppCurrentDownload from "@minimal/sections/overview/app/app-current-download"

export default function SampleComponent() {
  return (
    <MinimalProvider>
      <Container>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding={2}>
          <Stack spacing={1}>
            <AppFeatured list={_appFeatured} style={{ width: 500 }} />

            <AppCurrentDownload
              title="Current Download"
              chart={{
                series: [
                  { label: 'Mac', value: 12244 },
                  { label: 'Window', value: 53345 },
                  { label: 'iOS', value: 44313 },
                  { label: 'Android', value: 78343 },
                ],
              }}
            />

            <BasicButtons />

            {/* <RadioRating /> */}
          </Stack>
        </Box>
      </Container>
    </MinimalProvider>
  )
}
