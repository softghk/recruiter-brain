import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"
import { mergeRegister } from "@lexical/utils"
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
import React, { useCallback, useEffect, useRef, useState } from "react"

import { $isEmojiNode, editSvg, removeSvg } from "../popup-editor"

const TextComponent = ({
  text,
  nodeKey,
  className
}: {
  nodeKey: NodeKey
  text: string
  className: string
}) => {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const ref = useRef(null)

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isEmojiNode(node)) {
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

  //    dom.classList.add(`key_emoji_${this.__emoji_key}`)
  // inner.className = "emoji-inner"

  // dom.style.borderRadius = "8px"
  // inner.style.color = "white"
  // dom.style.background =
  //   " linear-gradient(95deg, #000 -2.16%, rgba(0, 0, 0, 0.42) 60.51%)"
  // dom.style.padding = "3px 8px"
  // dom.style.gap = "16px"
  // dom.style.display = "inline-flex"
  // dom.style.alignItems = "center"

  // spanElement.style.gap = "8px"
  // spanElement.style.display = "flex"
  // spanElement.style.alignItems = "center"
  // const buttonEdit = document.createElement("button")
  // const buttonRemove = document.createElement("button")

  // buttonEdit.type = "button"
  // buttonRemove.type = "button"
  // buttonEdit.onclick = this.handleEdit
  // buttonRemove.onclick = this.handleRemoveItem
  // buttonEdit.innerHTML = editSvg
  // buttonRemove.innerHTML = removeSvg
  // spanElement.appendChild(buttonEdit)
  // spanElement.appendChild(buttonRemove)
  // dom.appendChild(spanElement)
  // this.__chip = dom
  // dom.contentEditable = "false"
  // dom.focus()
  // dom.setAttribute("data-lexical-decorator", "true")
  return (
    <span
      className={`${className} emoji-inner`}
      style={{
        // border: "1px solid #eee",
        background:
          "linear-gradient(95deg, #000 -2.16%, rgba(0, 0, 0, 0.42) 60.51%)",
        color: "white",
        borderRadius: "8px",
        padding: "3px 8px",
        cursor: "pointer",
        userSelect: "none",
        outline: isFocused ? "2px solid rgb(60, 132, 244)" : undefined
      }}
      ref={ref}>
      <span>{text}</span>
      <span>
        <button>{editSvg}</button>
        <button>{removeSvg}</button>
      </span>
    </span>
  )
}

export default TextComponent
