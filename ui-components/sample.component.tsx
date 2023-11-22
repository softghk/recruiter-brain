import { Box, Container, Stack } from "@mui/material"
import { createGenerateClassName, StylesProvider } from "@mui/styles"
import React from "react"

import BasicButtons from "./basic-buttons.component"
import RadioRating from "./radio-rating.component"

const generateClassName = createGenerateClassName({
  seed: "myUniqueSeed"
})

export default function SampleComponent() {
  return (
    <StylesProvider generateClassName={generateClassName}>
      <Container>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding={2}>
          <Stack spacing={1}>
            <BasicButtons />

            <RadioRating />
          </Stack>
        </Box>
      </Container>
    </StylesProvider>
  )
}
