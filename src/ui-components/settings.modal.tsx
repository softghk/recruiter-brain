import MoreVertIcon from "@mui/icons-material/MoreVert"
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Slider,
  Stack,
  Switch,
  Typography
} from "@mui/material"
import React, { useEffect, useState } from "react"

import type { JobSettings } from "~src/types"
import { waitForElement } from "~src/utils/wait-for-element.utils"

import ModalHeaderComponent from "./modal-header.component"

const SettingsModal = ({
  open,
  onClose,
  data,
  onChange,
  onChangeJD,
  onEvaluate
}: {
  open: boolean
  onClose: any
  data: JobSettings
  onChange?: any
  onChangeJD?: any
  onEvaluate?: any
}) => {
  const [maxProfileCount, setMaxProfileCount] = useState<number>(30)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)

  const [temp, setTemp] = useState(data)

  useEffect(() => {
    setTemp(data)
  }, [data])

  useEffect(() => {
    const getResultCount = async () => {
      const querySelectorTargetElement = ".profile-list__header-info-text"
      await new Promise((resolve) => {
        waitForElement(querySelectorTargetElement, resolve)
      })

      const count = parseInt(
        document
          .querySelector(querySelectorTargetElement)
          ?.innerText?.split(" ")[0] || 30
      )
      setMaxProfileCount(count)
    }
    getResultCount()
  }, [])

  const onClickJD = () => {
    setAnchorEl(null)
    onChangeJD && onChangeJD()
  }

  return (
    <>
      <Menu
        id="more"
        disablePortal
        open={menuOpen}
        anchorEl={anchorEl}
        sx={{ zIndex: 99999 }}
        onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={onClickJD}>Change Job Description</MenuItem>
      </Menu>
      <Modal open={open} disablePortal disableScrollLock>
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
          <Box
            sx={{
              overflow: "auto",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2
            }}>
            <ModalHeaderComponent
              onClose={() => {
                onChange && onChange(temp)
                onClose && onClose()
              }}
            />

            <Card elevation={4}>
              <CardHeader
                title="Evalute Profiles"
                action={
                  <IconButton
                    id="more"
                    aria-controls={menuOpen ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Stack direction={"column"} gap={3}>
                  <Typography variant="body2">
                    Job Title: {temp.title || ""}
                  </Typography>
                  <Typography variant="body2">
                    How many profiles you want evaluate from this search?
                  </Typography>

                  <Box
                    display={"flex"}
                    alignItems={"center"}
                    gap={1}
                    maxWidth={420}>
                    <Typography variant="subtitle2">0</Typography>
                    <Slider
                      value={temp.searchLimit || 0}
                      onChange={(e, val) =>
                        setTemp({
                          ...temp,
                          searchLimit: typeof val === "object" ? val[0] : val
                        })
                      }
                      min={0}
                      max={maxProfileCount}
                      size="medium"
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="subtitle2">
                      {maxProfileCount}
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={temp.autoAdd || false}
                        onChange={(e) =>
                          setTemp({ ...temp, autoAdd: e.target.checked })
                        }
                      />
                    }
                    label="Automatically add to pipeline if rating is 7 or better"
                  />
                </Stack>
              </CardContent>
            </Card>

            <Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  onChange && onChange(temp)
                  onEvaluate && onEvaluate()
                }}>
                Start Evaluating Profiles
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default SettingsModal
