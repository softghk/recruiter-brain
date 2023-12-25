import React, { useEffect, useRef, useState } from "react"

import PopUpView, { type DataListType } from "~@minimal/sections/popup/view"

export const PopUp = () => {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState("")
  const listSelectedItem = useRef<DataListType[]>([])

  const handleSubmit = async (
    element: HTMLTextAreaElement | HTMLInputElement,
    list: DataListType[]
  ) => {
    if (element) {
      console.log("ref: ", list)
      let value = element.value
      for (const item of list) {
        value = await value.replaceAll(
          `\xa0/${item.title.replaceAll(" ", "_")}\xa0`,
          item.content
        )
      }
      return value
    }

    return undefined
  }

  async function handleKyeDown(
    e: KeyboardEvent,
    input: HTMLTextAreaElement | HTMLInputElement
  ) {
    if (e.key === "/") {
      ref.current = input
    } else {
      if (e.code === "Enter") {
        const newValue = await handleSubmit(input, listSelectedItem.current)

        input.value = newValue || input.value
        handleClosePopup()
      }
      if (e.code === "Backspace") {
        // TODO
      }
      if (ref.current !== null) {
        setSearchValue((oldSearch) => `${oldSearch}${e.key}`)
      }
    }
  }

  const handleCreateDivAndWatch = (
    input: HTMLTextAreaElement | HTMLInputElement
  ) => {
    const div = document.createElement("div")
    document.body.appendChild(div)
    div.id = input.id + "_div_popup"
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

  const initialInputs = () => {
    if (typeof window !== undefined) {
      const listInputs = [
        ...document.querySelectorAll("input"),
        ...document.querySelectorAll("textarea")
      ]
      listInputs.forEach((input) => {
        handleCreateDivAndWatch(input)
        input.onkeydown = async function (e) {
          return await handleKyeDown(e, input)
        }
      })
    }
  }
  useEffect(() => {
    initialInputs()
  }, [])

  const handleClosePopup = () => {
    ref.current = null
    setSearchValue("")
  }

  const handleClickNewItem = (item: DataListType) => {
    const input = ref.current
    if (input) {
      const title = item.title.replaceAll(" ", "_")
      const list = [...listSelectedItem.current, item]
      listSelectedItem.current = list
      const lastFindItem = input.value.lastIndexOf("/")
      input.value = input.value.slice(0, lastFindItem) + `\xa0/${title}\xa0`

      let highlighted = input.value
      for (const itemList of list) {
        const regex = new RegExp(
          `\xa0/${itemList.title.replaceAll(" ", "_")}`,
          "gi"
        )
        const markElement = (match: string) => {
          console.log("MATCH: ,", match)
          return match.includes(`<mark`)
            ? match
            : `<mark style="border-radius: 8px;color: transparent;background: linear-gradient(95deg, #000 -2.16%, rgba(0, 0, 0, 0.42) 60.51%);padding:1px 0;opacity:0.8;">${match}</mark>`
        }
        highlighted = highlighted.replaceAll(regex, markElement)
      }
      const div = document.getElementById(input.id + "_div_popup")
      div.innerHTML = highlighted

      handleClosePopup()
    }
  }

  return (
    <PopUpView
      anchorEl={ref.current}
      handleClosePopup={handleClosePopup}
      searchValue={searchValue}
      handleClickItem={handleClickNewItem}
    />
  )
}
