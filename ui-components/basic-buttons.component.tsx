import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import * as React from "react"

import { sendMessageToContentScript } from "~utils/message.utils"

export default function BasicButtons() {
  return (
    <Stack spacing={2} direction="row">
      <Button variant="text">Text</Button>
      <Button
        variant="contained"
        onClick={() => {
          console.log("clicked1", document)
          chrome.runtime.sendMessage(
            { action: "someAction" },
            function (response) {
              console.log("Response:", response)
            }
          )
        }}>
        Contained - Start scanning
      </Button>
      <Button variant="outlined">Outlined</Button>
    </Stack>
  )
}
