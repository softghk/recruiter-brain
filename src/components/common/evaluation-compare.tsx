import { Box, Stack, Typography } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import React, { useMemo } from "react"

import Iconify from "~@minimal/components/iconify"
import { fPercent } from "~@minimal/utils/format-number"

const EvaluationCompare = ({ percent }) => {
  const theme = useTheme()
  const icon = useMemo(() => {
    if (percent < 0) return "eva:trending-down-fill"
    if (percent > 0) return "eva:trending-up-fill"
    return "ic:baseline-trending-flat"
  }, [percent])

  return (
    <Stack direction="row" alignItems="center">
      <Iconify
        icon={icon}
        sx={{
          mr: 1,
          p: 0.5,
          width: 24,
          height: 24,
          borderRadius: "50%",
          color: "success.main",
          bgcolor: alpha(theme.palette.success.main, 0.16),
          ...(percent < 0 && {
            color: "error.main",
            bgcolor: alpha(theme.palette.error.main, 0.16)
          })
        }}
      />

      <Typography variant="subtitle2" component="div" noWrap>
        {percent > 0 && "+"}

        {fPercent(percent === -Infinity ? -100 : percent) || "0%"}

        <Box
          component="span"
          sx={{ color: "text.secondary", typography: "caption" }}>
          &nbsp;&nbsp;compared to average
        </Box>
      </Typography>
    </Stack>
  )
}

export default EvaluationCompare
