/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// import "./PollNode.css"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"
import { mergeRegister } from "@lexical/utils"
import { Menu, MenuItem, Typography } from "@mui/material"
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type BaseSelection,
  type NodeKey
} from "lexical"
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { DataListType } from "~@minimal/sections/popup/view"

// import Button from "../ui/Button"
// import joinClasses from "../utils/joinClasses"
import { $isPollNode, PollNode } from "./PollNode"

export default function PollComponent({
  text,
  items,
  nodeKey,
  ...props
}: {
  nodeKey: NodeKey
  items: DataListType[]
  text: string
  remove: () => void
  replace: (text: string) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const ref = useRef(null)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const onDelete = useCallback(
    (payload: Event) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: Event = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isPollNode(node)) {
          node.remove()
        }
      }
      return false
    },
    [isSelected, nodeKey]
  )

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()))
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload

          if (event.target === ref.current) {
            if (!event.shiftKey) {
              clearSelection()
            }
            setSelected(!isSelected)
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      )
    )
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected])

  const isFocused = $isNodeSelection(selection) && isSelected

  const handleEdit = (item: DataListType) => {
    editor.update(() => {
      // props.replace(new PollNode(item.title, items))
      props.replace(item.title)
      handleClose()
    })
  }

  const handleRemove = (e: any) => {
    editor.update(() => {
      props.remove()
    })
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(95deg, #000 -2.16%, rgba(0, 0, 0, 0.42) 60.51%)",
        color: "white",
        borderRadius: "8px",
        padding: "3px 8px",
        gap: "16px",
        userSelect: "none",
        display: "flex",
        outline: isFocused ? "2px solid rgb(60, 132, 244)" : undefined
      }}
      ref={ref}>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{
          ".MuiPaper-root": {
            backgroundColor: "rgb(0, 0, 0)",
            padding: "8px",
            borderRadius: "6px",
            minWidth: "200px"
          }
        }}
        MenuListProps={{
          "aria-labelledby": "basic-button",
          sx: {
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}>
        <Typography
          sx={{
            color: "#B9B9B9",
            borderRadius: "6px",
            padding: 0
          }}>
          My Data Sets
        </Typography>
        {items.map((item, index) => (
          <MenuItem
            key={index}
            sx={{
              color: "white",
              cursor: "pointer",
              borderRadius: "6px",
              padding: 0
            }}
            onClick={() => handleEdit(item)}>
            {item.title}
          </MenuItem>
        ))}
      </Menu>
      <span>{text}</span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
        <button
          style={{
            cursor: "pointer"
          }}
          type="button"
          onClick={handleClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none">
            <path
              d="M16.8652 1.94336H3.13477C2.47852 1.94336 1.94336 2.47852 1.94336 3.13477V16.8652C1.94336 17.5215 2.47852 18.0566 3.13477 18.0566H16.8652C17.5215 18.0566 18.0566 17.5215 18.0566 16.8652V3.13477C18.0566 2.47852 17.5215 1.94336 16.8652 1.94336ZM8.92578 5.77734H14.2227V11.0742L11.9883 8.83984L6.60547 14.2227L5.77734 13.3945L11.1602 8.01172L8.92578 5.77734Z"
              fill="#757578"
            />
          </svg>
        </button>
        <button
          style={{
            cursor: "pointer"
          }}
          type="button"
          onClick={handleRemove}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none">
            <g opacity="0.48">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.3334 10C18.3334 14.6025 14.6026 18.3334 10.0001 18.3334C5.39758 18.3334 1.66675 14.6025 1.66675 10C1.66675 5.39752 5.39758 1.66669 10.0001 1.66669C14.6026 1.66669 18.3334 5.39752 18.3334 10ZM7.47508 7.47502C7.59227 7.35798 7.75112 7.29224 7.91675 7.29224C8.08237 7.29224 8.24123 7.35798 8.35841 7.47502L10.0001 9.11669L11.6417 7.47502C11.7602 7.36462 11.9169 7.30452 12.0789 7.30737C12.2408 7.31023 12.3953 7.37583 12.5098 7.49034C12.6243 7.60485 12.6899 7.75933 12.6927 7.92125C12.6956 8.08317 12.6355 8.23987 12.5251 8.35835L10.8834 10L12.5251 11.6417C12.6355 11.7602 12.6956 11.9169 12.6927 12.0788C12.6899 12.2407 12.6243 12.3952 12.5098 12.5097C12.3953 12.6242 12.2408 12.6898 12.0789 12.6927C11.9169 12.6955 11.7602 12.6354 11.6417 12.525L10.0001 10.8834L8.35841 12.525C8.23994 12.6354 8.08323 12.6955 7.92131 12.6927C7.7594 12.6898 7.60491 12.6242 7.4904 12.5097C7.37589 12.3952 7.31029 12.2407 7.30744 12.0788C7.30458 11.9169 7.36468 11.7602 7.47508 11.6417L9.11675 10L7.47508 8.35835C7.35804 8.24117 7.2923 8.08231 7.2923 7.91669C7.2923 7.75106 7.35804 7.59221 7.47508 7.47502Z"
                fill="#D2D2D2"
              />
            </g>
          </svg>
        </button>
      </span>
    </div>
  )
}
