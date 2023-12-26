import React, { useEffect, useRef, useState } from "react"

import PopUpView, { type DataListType } from "~@minimal/sections/popup/view"

let isOpen = {
  open: false
}
export const PopUp = () => {
  // const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState("")
  const [inputAnchorEl, setInputAnchorEl] = useState<
    HTMLTextAreaElement | HTMLInputElement | null
  >(null)
  const listSelectedItem = useRef<DataListType[]>([])

  const handleSubmit = async (
    element: HTMLTextAreaElement | HTMLInputElement | null,
    list: DataListType[]
  ) => {
    if (element) {
      const div = document.getElementById(element.id + "_div_popup")
      div.innerHTML = ""
      let value = element.value
      for (const item of list) {
        value = await value.replaceAll(
          `\xa0/${item.title.replaceAll(" ", "_")}\xa0`,
          item.content
        )
      }
      console.log(" OLDVALUE: ", {
        value,
        inputValue: element.value,
        html: div.innerHTML
      })
      return value
    }

    return undefined
  }

  const handleSetKeyLabel = (
    input: HTMLTextAreaElement | HTMLInputElement,
    list: DataListType[]
  ) => {
    let highlighted = input.value
    for (const itemList of list) {
      const regex = new RegExp(
        `\xa0/${itemList.title.replaceAll(" ", "_")}`,
        "gi"
      )
      const markElement = (match: string) =>
        `<mark style="border-radius: 8px;color: transparent;background: linear-gradient(95deg, #000 -2.16%, rgba(0, 0, 0, 0.42) 60.51%);padding:1px 0;opacity:0.8;">${match}</mark>`

      highlighted = highlighted.replaceAll(regex, markElement)
    }
    const div = document.getElementById(input.id + "_div_popup")
    div.innerHTML = highlighted
  }

  async function handleKyeUp(
    e: KeyboardEvent,
    input: HTMLTextAreaElement | HTMLInputElement
  ) {
    if (e.key === "/") {
      setInputAnchorEl(input)
      isOpen.open = true
    } else {
      const value = input.value
      if (e.code === "Backspace") {
        handleSetKeyLabel(input, listSelectedItem.current)
        // TODO fix the backspace for removing other tags
      }
      if (isOpen.open === true) {
        setSearchValue(value?.slice(value?.lastIndexOf("/") + 1))
      }
    }
  }
  async function handleKyeDown(
    e: KeyboardEvent,
    input: HTMLTextAreaElement | HTMLInputElement
  ) {
    const value = input.value
    if (e.code === "Enter") {
      const newValue = await handleSubmit(input, listSelectedItem.current)
      input.value = newValue || value
      handleClosePopup()
    }
    
  }

  const handleCreateDivAndWatch = (
    input: HTMLTextAreaElement | HTMLInputElement
  ) => {
    const div = document.createElement("div")
    document.body.appendChild(div)
    div.id = input.id + "_div_popup"

    const handleResize = () => {
      const sizeInput = input.getBoundingClientRect()

      for (const style in input.style) {
        div.style.setProperty(style, input.style[style])
      }
      for (const classList of input.classList) {
        div.classList.add(classList)
      }

      div.style.zIndex = 1 + ""
      div.style.position = "absolute"
      div.style.color = "transparent"
      div.style.wordWrap = "break-word"
      div.style.whiteSpace = "pre-wrap"
      div.style.overflow = "auto"
      div.style.pointerEvents = "none"
      div.style.transition = "transform 1s"
      input.style.background = "unset"

      div.style.width = sizeInput.width + "px"
      div.style.height = sizeInput.height + "px"
      div.style.top = sizeInput.top + "px"
      div.style.left = sizeInput.left + "px"
    }
    handleResize()
    document.body.addEventListener("resize", handleResize)
  }

  const initialInputs = () => {
    if (typeof window !== undefined) {
      const listInputs = [
        ...document.querySelectorAll("input"),
        ...document.querySelectorAll("textarea")
      ]
      listInputs.forEach((input) => {
        handleCreateDivAndWatch(input)
        function checkButton() {
          var button = document.querySelector(
            "[data-testid=send-button]"
          ) as HTMLButtonElement
          if (button) {
            button.addEventListener("click", async (e) => {
              const newValue = await handleSubmit(
                input,
                listSelectedItem.current
              )
              input.value = newValue || input.value
              handleClosePopup()
            })
          }
        }
        checkButton()
        setInterval(checkButton, 1000)
        input.onkeydown = async function (e) {
          return await handleKyeDown(e, input)
        }
        input.onkeyup = async function (e) {
          return await handleKyeUp(e, input)
        }
      })
    }
  }
  useEffect(() => {
    initialInputs()
  }, [])

  const handleClosePopup = () => {
    setInputAnchorEl(null)
    setSearchValue("")
    isOpen.open = false
  }

  const handleClickNewItem = (item: DataListType) => {
    const input = inputAnchorEl
    if (input) {
      const title = item.title.replaceAll(" ", "_")
      const list = [...listSelectedItem.current, item]
      listSelectedItem.current = list
      const lastFindItem = input.value.lastIndexOf("/")
      input.value = input.value.slice(0, lastFindItem) + `\xa0/${title}\xa0`

      handleSetKeyLabel(input, list)
      handleClosePopup()
    }
  }

  return (
    <PopUpView
      anchorEl={inputAnchorEl}
      handleClosePopup={handleClosePopup}
      handleClickItem={handleClickNewItem}
      searchValue={searchValue}
    />
  )
}
