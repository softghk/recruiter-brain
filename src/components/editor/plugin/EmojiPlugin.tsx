import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $wrapNodeInElement } from "@lexical/utils"
import {
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand
} from "lexical"
import React, { useEffect } from "react"

import type { DataListType } from "~@minimal/sections/popup/view"

import { $createPollNode, PollNode } from "../PollNode"
import { $createEmojiNode, EmojiNode } from "../popup-editor"

export const INSERT_EMOJI_COMMAND: LexicalCommand<{
  text: string
  items: DataListType[]
}> = createCommand("INSERT_EMOJI_COMMAND")

export const INSERT_POLL_COMMAND: LexicalCommand<{
  text: string
  items: DataListType[]
}> = createCommand("INSERT_POLL_COMMAND")

export const EmojiPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("PollPlugin: PollNode not registered on editor")
    }

    return editor.registerCommand<{ text: string; items: DataListType[] }>(
      INSERT_EMOJI_COMMAND,
      (payload) => {
        const emojiNode = $createEmojiNode(
          payload.text,
          payload.text,
          payload.items
        )
        $insertNodes([emojiNode, $createTextNode(" ")])
        if ($isRootOrShadowRoot(emojiNode.getParentOrThrow())) {
          console.log("PAYLOAd: ", payload, emojiNode)
          $wrapNodeInElement(emojiNode, $createParagraphNode).selectEnd()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])
  useEffect(() => {
    if (!editor.hasNodes([PollNode])) {
      throw new Error("PollPlugin: PollNode not registered on editor")
    }

    return editor.registerCommand<{ text: string; items: DataListType[] }>(
      INSERT_POLL_COMMAND,
      (payload) => {
        const pollNode = $createPollNode(payload.text, payload.items)
        $insertNodes([pollNode])
        if ($isRootOrShadowRoot(pollNode.getParentOrThrow())) {
          $wrapNodeInElement(pollNode, $createParagraphNode).selectEnd()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  // const onDelete = useCallback(
  //   (payload: KeyboardEvent) => {
  //     if (isSelected && $isNodeSelection($getSelection())) {
  //       const event: KeyboardEvent = payload
  //       event.preventDefault()
  //       const node = $getNodeByKey(nodeKey)
  //       if ($isEmojiNode(node)) {
  //         node.remove()
  //       }
  //     }
  //     return false
  //   },
  //   [isSelected, nodeKey]
  // )

  // useEffect(() => {
  //   return mergeRegister(
  //     editor.registerUpdateListener(({ editorState }) => {
  //       setSelection(editorState.read(() => $getSelection()))
  //     }),
  //     editor.registerCommand<MouseEvent>(
  //       CLICK_COMMAND,
  //       (payload) => {
  //         const event = payload

  //         if (event.target === ref.current) {
  //           if (!event.shiftKey) {
  //             clearSelection()
  //           }
  //           setSelected(!isSelected)
  //           return true
  //         }

  //         return false
  //       },
  //       COMMAND_PRIORITY_LOW
  //     ),
  //     editor.registerCommand(
  //       KEY_DELETE_COMMAND,
  //       onDelete,
  //       COMMAND_PRIORITY_LOW
  //     ),
  //     editor.registerCommand(
  //       KEY_BACKSPACE_COMMAND,
  //       onDelete,
  //       COMMAND_PRIORITY_LOW
  //     )
  //   )
  // }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected])

  // const isFocused = $isNodeSelection(selection) && isSelected

  return null
}
