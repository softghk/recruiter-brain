import { useEffect, useState } from "react"

import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"

import { Box, Button, TextField, Typography } from "@mui/material"

import { sendMessageToContentScript } from "./utils/message.utils"

function IndexPopup() {
  const [jobDescription, setJobDescription] = useState("")

  // Load the job description from chrome.storage.local when the component mounts
  useEffect(() => {
    chrome.storage.local.get(["jobDescription"], function (result) {
      if (result.jobDescription) {
        setJobDescription(result.jobDescription)
      }
    })
  }, [])

  const handleSave = () => {
    // Save the job description to chrome.storage.local
    chrome.storage.local.set({ jobDescription }, () => {
      console.log("Job Description saved:", jobDescription)
    })
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minWidth: "350px",
        minHeight: "200px",
        overflow: "auto",
        backgroundColor: "#0F1419"
      }}>
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          padding: 2,
          borderRadius: 2,
          boxShadow: 1,
          marginBottom: 2 // Add some margin at the bottom of the box
        }}>
        <Typography variant="h5" gutterBottom sx={{ color: "#212121" }}>
          Job Description
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={jobDescription || ""}
          onChange={(event) => setJobDescription(event.target.value)}
          sx={{
            "& .MuiInputBase-input": {
              color: "text.primary"
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#ced4da"
              },
              "&:hover fieldset": {
                borderColor: "#212121"
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3f51b5"
              }
            },
            marginBottom: 2 // Adds margin to the bottom of the TextField
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{
            ":hover": {
              backgroundColor: "secondary.main"
            }
          }}>
          Save Job Description
        </Button>
      </Box>

      {/* More components or functionality can be added here */}
      <Button
        onClick={() => {
          sendMessageToContentScript("extract-and-analyze-profile-data")
          window.close()
        }}
        sx={{ marginTop: 2 }}
        variant="contained"
        color="primary"
        size="small"
        style={{
          marginBottom: 8
        }}>
        Analyze Profiles
      </Button>
    </div>
  )
}

export default IndexPopup
