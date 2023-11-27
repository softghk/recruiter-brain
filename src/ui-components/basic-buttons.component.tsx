import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import * as React from "react"

import { generateMD5 } from "~src/utils/hash.utils"

export default function BasicButtons() {
  const href = window.location.href
  const [jobDescription, setJobDescription] = React.useState("")

  // Load the job description from chrome.storage.local when the component mounts
  React.useEffect(() => {
    chrome.storage.local.get(["jobDescription"], function (result) {
      if (result.jobDescription) {
        setJobDescription(result.jobDescription)
      }
    })
  }, [])
  return (
    <Stack spacing={2} direction="row">
      {/* <Button variant="text">Text</Button> */}
      <Button
        variant="contained"
        onClick={() => {
          chrome.runtime.sendMessage({
            action: "evaluate-profiles",
            data: {
              projectId: href.match(/\/(\d+)\//)?.[1],
              searchContextId: (href.match(/searchContextId=([^&]+)/) || [])[1],
              jobDescriptionId: generateMD5(jobDescription),
              href: href,

              amount: 25,
              jobDescription: jobDescription
            }
          })
        }}>
        Evaluate Profiles
      </Button>
      {/* <Button variant="outlined">Outlined</Button> */}
    </Stack>
  )
}
