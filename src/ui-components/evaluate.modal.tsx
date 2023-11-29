import {
  Box,
  Button,
  Card,
  Modal,
  Stack,
  TextField,
  Typography
} from "@mui/material"
import ActivatedHelpImage from "data-base64:~assets/activated-help.png"
import React, { useEffect, useMemo, useState } from "react"

import { JobInitialSetting, type JobSettings } from "~src/types"

import ModalHeaderComponent from "./modal-header.component"
import ResetJDModal from "./resetjd-modal.component"

const parseLines = (value) => value.replace(/(\\n)/g, "\n")

const EvaluateModal = ({
  open,
  onClose,
  onFinish,
  data,
  onReset
}: {
  open: boolean
  onClose?: any
  onFinish?: any
  data: JobSettings
  onReset?: any
}) => {
  const [activated, setActivated] = useState(false)
  const [temp, setTemp] = useState<JobSettings>(data || JobInitialSetting)
  const [resetModal, setResetModal] = useState(false)

  useEffect(() => {
    setTemp(data)
  }, [data])

  const onSaveJD = () => {
    setActivated(true)
    onFinish && onFinish(temp)
  }

  const onFinishActivate = () => {
    setActivated(false)
    onClose && onClose()
  }

  const renderJDInput = () => (
    <>
      <Card sx={{ padding: 3 }} elevation={4}>
        <Stack direction={"column"} gap={3}>
          <Stack direction={"column"} gap={2}>
            <Typography variant="h6">Job Description</Typography>
            <Typography variant="caption" color={"gray"}>
              To use RecruiterBrain for a project, enter the job description
              first. This description helps evaluate profiles for the job. The
              job title is just for reference.
            </Typography>
            <Typography variant="caption">
              Caution: Resetting the job description will delete all evaluations
              for that project.
            </Typography>
          </Stack>

          <TextField
            label="Job Title"
            value={temp.title}
            placeholder="Job Title"
            disabled={data.title !== ""}
            onChange={(e) => setTemp({ ...temp, title: e.target.value })}
          />
          <TextField
            multiline
            rows={5}
            value={parseLines(temp.description)}
            placeholder="Job Description"
            disabled={data.description !== ""}
            onChange={(e) => setTemp({ ...temp, description: e.target.value })}
          />
        </Stack>
      </Card>

      <Box>
        {data.title !== "" || data.description !== "" ? (
          <Button variant="outlined" onClick={() => setResetModal(true)}>
            Reset
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onSaveJD}>
            Save Job Description
          </Button>
        )}
      </Box>
    </>
  )

  const renderCompleted = () => (
    <Stack direction={"column"} gap={2} width={"100%"}>
      <Typography variant="h6">RecruiterBrain is activated</Typography>
      <Typography variant="caption" color="gray">
        You can now start using RecruiterBrain for this project.
      </Typography>
      <img src={ActivatedHelpImage} alt="How to start RecruiterBrain" />
      <Typography variant="caption" color="gray">
        Caution: Resetting the job description will delete all evaluations for
        that project.
      </Typography>
      <Button variant="contained" onClick={onFinishActivate}>
        Close
      </Button>
    </Stack>
  )

  return (
    <>
      <ResetJDModal
        open={resetModal}
        onCancel={() => setResetModal(false)}
        onOk={() => {
          onReset && onReset()
          setResetModal(false)
        }}
      />
      <Modal open={open} disablePortal disableScrollLock sx={{ zIndex: 1500 }}>
        <Box
          sx={{
            padding: 5,
            position: "absolute",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            boxShadow: 24,
            top: "50%",
            left: "50%",
            borderRadius: 2,
            width: 800,
            maxHeight: "100%",
            overflow: "hidden",
            display: "flex"
          }}>
          <Stack direction={"column"} gap={2}>
            <ModalHeaderComponent onClose={onFinishActivate} />
            {!activated ? renderJDInput() : renderCompleted()}
          </Stack>
        </Box>
      </Modal>
    </>
  )
}

export default EvaluateModal
