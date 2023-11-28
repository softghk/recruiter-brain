import { _appFeatured } from "@minimal/_mock"
import { MinimalProvider } from "@minimal/Provider"
import { Box, Button, Container, Modal, Stack, StepContent, StepLabel, Stepper, Step, Typography, TextField, FormControlLabel, Switch, Slider, StepConnector } from "@mui/material"
import React, { useEffect, useMemo, useState } from "react"
import Logo from 'react:~assets/logo.svg'

import Iconify from "~@minimal/components/iconify"
import { JobInitialSetting, type JobSettings } from "~src/types"
import ResetJDModal from "./resetjd-modal.component"
import EvaluationButton from "./evaluation-button.component"

const parseLines = (value) => value.replace(/(\\n)/g, "\n");

export default function SampleComponent() {

  const [open, setOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [settings, setSettings] = useState<JobSettings>(JobInitialSetting)
  const [description, setDescription] = useState('')
  const [maxProfileCount, setMaxProfileCount] = useState<number>(30)

  const isDescriptionFilled = useMemo(() => settings.description.trim().length > 3, [settings.description])

  useEffect(() => {
    const count = parseInt(document.querySelector('.profile-list__header-info-text')?.innerText || 30)
    setMaxProfileCount(count)
  }, [])

  const onResetJobDescription = () => {
    setResetOpen(false)
    setDescription('')
    setSettings({ ...settings, description: '' })
  }


  const onNextStep = () => setActiveStep(Math.min(2, activeStep + 1))
  const onPrevStep = () => setActiveStep(Math.max(0, activeStep - 1))

  return (
    <MinimalProvider>
      <Button onClick={() => setOpen(true)}>Evaluate Profiles</Button>
      <ResetJDModal
        open={resetOpen}
        onOk={onResetJobDescription}
        onCancel={() => setResetOpen(false)}
      />
      <Modal
        open={open}
        disablePortal
        disableScrollLock
        onClose={() => setOpen(false)}
      >
        <Box sx={{
          padding: 5,
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          boxShadow: 24,
          top: '50%',
          left: '50%',
          borderRadius: 2,
          width: 800,
          maxHeight: '100%',
          overflow: 'hidden',
          display: 'flex'
        }}>
          <Box sx={{ overflow: 'auto', width: '100%' }}>
            {/* Render Modal Header */}
            <Stack
              direction={'row'}
              justifyContent={'flex-end'}
              alignItems={'center'}
            >
              <Logo />
            </Stack>
            <Stepper activeStep={activeStep} orientation="vertical" connector={<StepConnector />}>
              <Step key="0">
                <StepLabel>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="subtitle2">
                      Step 1: Job Description
                    </Typography>
                    <Typography variant="caption" color={'gray'}>
                      Caution: Evaluations rely on this job description; resetting it will erase all existing evaluations.
                    </Typography>
                    {
                      activeStep > 0 && (
                        <TextField
                          disabled
                          multiline
                          rows={3}
                          value={parseLines(settings.description)}
                          sx={{
                            "& .MuiInputBase-input": {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                          }}
                        />
                      )
                    }
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant="body2">
                      Please provide a job description
                    </Typography>

                    <Box position={'relative'}>
                      <TextField
                        rows={5}
                        multiline
                        fullWidth
                        variant="outlined"
                        placeholder="Job Description"
                        value={description}
                        disabled={isDescriptionFilled}
                        onChange={(e) => setDescription(e.target.value)}
                        helperText={
                          !isDescriptionFilled && (
                            <Box display={'flex'} gap={0.75} alignItems={'center'}>
                              <Iconify icon={'material-symbols:info'} />
                              <Typography variant="caption" color={'gray'}>Enter Job Description to proceed</Typography>
                            </Box>
                          )
                        }
                      />

                      {
                        isDescriptionFilled ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setResetOpen(true)}
                            sx={{ position: 'absolute', backgroundColor: 'white', right: 16, bottom: isDescriptionFilled ? 16 : 46 }}
                          >
                            Reset
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => setSettings({ ...settings, description })}
                            sx={{ position: 'absolute', right: 16, bottom: isDescriptionFilled ? 16 : 46 }}
                          >
                            Save
                          </Button>
                        )
                      }
                    </Box>

                    <Box>
                      <Button
                        onClick={onNextStep}
                        variant="contained"
                        size="small"
                        disabled={!isDescriptionFilled}
                      >
                        Continue
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>

              <Step key="1">
                <StepLabel>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="subtitle2">
                      Step 2: Evaluation Settings
                    </Typography>
                    <Typography variant="caption" color={'gray'} marginBottom={1}>
                      Specify the number of prospects for evaluation and the desired actions to be taken
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant="body2">How many profiles you want evaluate from this search?</Typography>

                    <Box display={'flex'} alignItems={'center'} gap={1} maxWidth={420}>
                      <Typography variant="subtitle2">0</Typography>
                      <Slider
                        min={0}
                        value={settings.searchLimit}
                        onChange={(e, val) => setSettings({ ...settings, searchLimit: typeof val === 'object' ? val[0] : val })}
                        max={maxProfileCount}
                        size="medium"
                        defaultValue={20}
                        valueLabelDisplay="auto"
                      />
                      <Typography variant="subtitle2">{maxProfileCount}</Typography>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch checked={settings.autoAdd} onChange={e => setSettings({ ...settings, autoAdd: e.target.checked })} />
                      }
                      label="Automatically add to pipeline if rating is 7 or better"
                    />

                    <Box>
                      <Button onClick={onPrevStep} size="small">Back</Button>
                      <Button onClick={onNextStep} variant="contained" size="small">Continue</Button>
                    </Box>
                  </Box>

                </StepContent>
              </Step>

              <Step key="2">
                <StepLabel>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="subtitle2">
                      Step 3: Start Evaluation Job
                    </Typography>
                    <Typography variant="caption" color={"gray"}>
                      Start Evaluation for this search.
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant="caption">
                      A new tab will open. Please wait to return to this tab before
                    </Typography>

                    <Box display={'flex'} gap={1}>
                      <Button onClick={onPrevStep} size="small">Back</Button>
                      <EvaluationButton onClick={() => setOpen(false)} settings={settings} />
                    </Box>

                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Box>
        </Box>
      </Modal>
    </MinimalProvider>
  )
}
