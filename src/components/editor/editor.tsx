import {
  LexicalComposer
  // type InitialEditorStateType
} from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import {
  CLEAR_EDITOR_COMMAND,
  type EditorState,
  type LexicalEditor
} from "lexical"
import { useEffect, useLayoutEffect, useState } from "react"
import { observer } from "rosma"

import type { DataListType } from "~@minimal/sections/popup/view"
import { collectionName } from "~src/firebase/firebaseApi"
import { db } from "~src/firebase/firebaseClient"

import { MentionNode } from "./MentionNode"
import ComponentPickerMenuPlugin from "./picker"
import PopUpPlugin from "./plg"
import { EmojiPlugin } from "./plugin/EmojiPlugin"
import { ClearEditorPlugin } from "./plugin/LexicalEditor"
import { PollNode } from "./PollNode"
import { EmojiNode } from "./popup-editor"
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme"

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    observer.set({
      editor
    })
    // Focus the editor when the effect fires!
    editor.focus()
  }, [editor])

  return null
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error) {
  console.error(error)
}

function SubmitBtn({
  // buttonCustom,
  input,
  items
}: {
  // buttonCustom: HTMLButtonElement | null
  input: HTMLTextAreaElement | HTMLInputElement
  items: DataListType[]
}) {
  const [editor] = useLexicalComposerContext()

  useLayoutEffect(() => {
    const form = input.parentElement?.parentElement?.parentElement
      ?.parentElement as HTMLFormElement
    if (form) {
      form.onsubmit = () => {
        setTimeout(() => {
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
        }, 300)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      editor.update(() => {
        const inputEvent = new Event("input", e)
        input.dispatchEvent(inputEvent)
      })
    }
    const onKeyDown = (e: KeyboardEvent) => {
      editor.update(() => {
        if (e.key === "Enter" && !e.shiftKey) {
          ;(
            document.querySelector(
              "[data-testid=send-button]"
            ) as HTMLButtonElement
          )?.click()
        }
      })
    }

    return editor.registerRootListener(
      (
        rootElement: null | HTMLElement,
        prevRootElement: null | HTMLElement
      ) => {
        if (prevRootElement !== null) {
          prevRootElement.removeEventListener("keyup", onKeyUp)
          prevRootElement.removeEventListener("keydown", onKeyDown)
        }
        if (rootElement !== null) {
          rootElement.addEventListener("keyup", onKeyUp)
          rootElement.addEventListener("keydown", onKeyDown)
        }
      }
    )
  }, [editor])

  return <></>
}

export function Editor({
  input
}: {
  input: HTMLTextAreaElement | HTMLInputElement
  items: DataListType[]
}) {
  const [items, setItems] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy("createdDate", "desc")
    )
    onSnapshot(q, (querySnapshot) => {
      let docs = []
      querySnapshot.forEach((doc) => {
        const docItem = { ...doc.data() }
        docs.push({ ...docItem, id: doc.id })
      })
      setItems(docs)
    })
  }, [])
  const loadContent = (editor: LexicalEditor) => {
    return editor.getEditorState()
  }

  const onChangeEditor = (editorState: EditorState, editor: LexicalEditor) => {
    editor.registerTextContentListener((text) => {})
    editor.update(() => {
      const root = editorState.toJSON()
      let text = ""
      root.root.children.forEach((line, index) => {
        // @ts-expect-error
        line.children.forEach((word) => {
          if (word.type === "text") {
            text = `${text} ${word.text}`
          }
          if (word.type === "poll") {
            const foundedItem = items.find((item) =>
              word.text.includes(item.title)
            )
            if (foundedItem) {
              text = `${text}${foundedItem.content}`
            }
          }
          if (word.type === "linebreak") {
            text = `${text} \n`
          }
        })
      })
      const keyPressEvent = new KeyboardEvent("keypress")
      const keydownEvent = new KeyboardEvent("keydown")
      const keyUpEvent = new KeyboardEvent("keypress")
      const changeEvent = new Event("change")
      const inputEvent = new Event("input")

      input.dispatchEvent(changeEvent)
      input.dispatchEvent(keydownEvent)
      input.dispatchEvent(keyUpEvent)
      input.dispatchEvent(keyPressEvent)
      input.dispatchEvent(inputEvent)
      input.value = text
      input.textContent = text
    })
  }

  const initialConfig = {
    namespace: "MyEditor",
    theme: PlaygroundEditorTheme,
    onError,
    nodes: [EmojiNode, MentionNode, PollNode],
    editorState: loadContent
  }
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translate(0, -50%)",
              zIndex: 0,
              color: "#95959C"
            }}>
            {input.placeholder}
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <PopUpPlugin />
      <HistoryPlugin />
      <MyCustomAutoFocusPlugin />
      <OnChangePlugin onChange={onChangeEditor} />
      <ClearEditorPlugin />
      <EmojiPlugin />
      <ComponentPickerMenuPlugin input={input} items={items} />
      <SubmitBtn input={input} items={items} />
    </LexicalComposer>
  )
}
