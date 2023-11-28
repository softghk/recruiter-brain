import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import * as React from "react"
import type { JobSettings } from "~src/types"

import { generateMD5 } from "~src/utils/hash.utils"

export default function EvaluationButton({
  onClick,
  settings
}: {
  onClick?: any,
  settings: JobSettings
}) {
  const href = window.location.href

  const onEvalutate = (e) => {
    onClick && onClick()
    chrome.runtime.sendMessage({
      action: "evaluate-profiles",
      data: {
        projectId: href.match(/\/(\d+)\//)?.[1],
        searchContextId: (href.match(/searchContextId=([^&]+)/) || [])[1],
        jobDescriptionId: generateMD5(settings.description || ''),
        href: href,

        amount: settings.searchLimit || 20,
        jobDescription: settings.description || ''
      }
    })
  }

  return (
    <Stack spacing={2} direction="row">
      <Button
        variant="contained"
        size="small"
        onClick={onEvalutate}
      >
        Start Evaluation
      </Button>
    </Stack>
  )
}
