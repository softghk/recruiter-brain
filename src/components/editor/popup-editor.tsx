import { LexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread
} from "lexical"
import { DecoratorNode, TextNode } from "lexical"
import React, { Suspense } from "react"
import { observer } from "rosma"

import type { DataListType } from "~@minimal/sections/popup/view"

const TextComponent = React.lazy(() => import("./plugin/TextComponent"))

export type SerializedEmojiNode = Spread<
  {
    className: string
    type: "emoji"
    items: DataListType[]
  },
  SerializedTextNode
>

export const removeSvg = `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none">
      <g opacity="0.48">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.3334 10C18.3334 14.6025 14.6026 18.3334 10.0001 18.3334C5.39758 18.3334 1.66675 14.6025 1.66675 10C1.66675 5.39752 5.39758 1.66669 10.0001 1.66669C14.6026 1.66669 18.3334 5.39752 18.3334 10ZM7.47508 7.47502C7.59227 7.35798 7.75112 7.29224 7.91675 7.29224C8.08237 7.29224 8.24123 7.35798 8.35841 7.47502L10.0001 9.11669L11.6417 7.47502C11.7602 7.36462 11.9169 7.30452 12.0789 7.30737C12.2408 7.31023 12.3953 7.37583 12.5098 7.49034C12.6243 7.60485 12.6899 7.75933 12.6927 7.92125C12.6956 8.08317 12.6355 8.23987 12.5251 8.35835L10.8834 10L12.5251 11.6417C12.6355 11.7602 12.6956 11.9169 12.6927 12.0788C12.6899 12.2407 12.6243 12.3952 12.5098 12.5097C12.3953 12.6242 12.2408 12.6898 12.0789 12.6927C11.9169 12.6955 11.7602 12.6354 11.6417 12.525L10.0001 10.8834L8.35841 12.525C8.23994 12.6354 8.08323 12.6955 7.92131 12.6927C7.7594 12.6898 7.60491 12.6242 7.4904 12.5097C7.37589 12.3952 7.31029 12.2407 7.30744 12.0788C7.30458 11.9169 7.36468 11.7602 7.47508 11.6417L9.11675 10L7.47508 8.35835C7.35804 8.24117 7.2923 8.08231 7.2923 7.91669C7.2923 7.75106 7.35804 7.59221 7.47508 7.47502Z"
          fill="#D2D2D2"
        />
      </g>
    </svg>`

export const editSvg = `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none">
      <path
        d="M16.8652 1.94336H3.13477C2.47852 1.94336 1.94336 2.47852 1.94336 3.13477V16.8652C1.94336 17.5215 2.47852 18.0566 3.13477 18.0566H16.8652C17.5215 18.0566 18.0566 17.5215 18.0566 16.8652V3.13477C18.0566 2.47852 17.5215 1.94336 16.8652 1.94336ZM8.92578 5.77734H14.2227V11.0742L11.9883 8.83984L6.60547 14.2227L5.77734 13.3945L11.1602 8.01172L8.92578 5.77734Z"
        fill="#757578"
      />
    </svg>`

function genMenu(items: DataListType[]): HTMLDivElement {
  const div = document.createElement("div")
  div.style.display = "none"
  div.style.position = "absolute"
  div.style.transform = "translate(0px, calc(-100% - 20px))"
  div.innerHTML =
    `
   <ul style="background-color: rgb(0, 0, 0); padding: 8px; border-radius: 6px; min-width: 200px; display: flex; gap: 12px; flex-direction: column;">
    <p class="MuiTypography-root MuiTypography-body1 css-ahj2mt-MuiTypography-root" style="color: rgb(185, 185, 185);">My Data Sets</p>` +
    items
      .map((item, index) => {
        return `
      <li tabindex="-1" class="item selected" role="option" aria-selected="true" id="typeahead-item-${index}" style="color: rgb(255, 255, 255); border-radius: 6px; cursor: pointer;">${item.title}<span><i class="icon paragraph"></i></span>
      </li>
     `
      })
      .join("") +
    `
     </ul>
     `
  return div
}

function convertEmojiElement(domNode: HTMLElement): DOMConversionOutput | null {
  const items = domNode.getAttribute("data-lexical-emoji-items")
  const text = domNode.getAttribute("data-lexical-emoji-text")
  if (items !== null && text !== null) {
    const node = $createEmojiNode(text, text, JSON.parse(items))
    return { node }
  }
  return null
}

export class EmojiNode extends TextNode {
  // export class EmojiNode extends DecoratorNode<JSX.Element> {
  __className: string
  __chip!: HTMLSpanElement
  __menu!: HTMLDivElement

  static getType(): string {
    return "emoji"
  }
  static context = LexicalComposerContext

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(
      node.__className,
      node.__text,
      node.__items,
      node.__key
    )
  }

  constructor(
    className: string,
    text: string,
    private readonly __items: DataListType[],
    key?: NodeKey
  ) {
    super(text, key)
    this.__className = className
    this.handleRemoveItem = this.handleRemoveItem.bind(this)
    this.handleEdit = this.handleEdit.bind(this)
    this.__menu = genMenu(__items)
    document.body.appendChild(this.__menu)
    ;[...this.__menu.querySelectorAll("li")].forEach((li) => {
      ;(li as HTMLLIElement).addEventListener("click", () => {
        this.__menu.style.display = "none"
        const editor: LexicalEditor = observer.get("editor")
        editor.update(() => {
          const tex = li.innerText.trim()
          this.setTextContent(tex)
          this.replace(new EmojiNode(tex, `${tex}`, __items))
        })
      })
    })
    document.body.addEventListener("click", (e) => {
      if (this.__menu.style.display === "block") {
        if (
          // @ts-ignore
          !this.__menu.contains(e.target) &&
          // @ts-ignore
          !this.__chip.contains(e.target)
        ) {
          this.__menu.style.display = "none"
        }
      }
    })
  }

  handleRemoveItem() {
    const editor: LexicalEditor = observer.get("editor")
    editor.update(() => {
      this.remove()
      this.__menu.style.display = "none"
    })
  }

  handleEdit() {
    const cbr = this.__chip.getBoundingClientRect()
    // const mbr = this.__menu.getClientRects()
    this.__menu.style.display = "block"
    this.__menu.style.left = `${cbr.left}px`
    this.__menu.style.top = `${cbr.top + 20}px`

    // console.log(this.__menu)
    // console.table([cbr, mbr])
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-emoji-text")) {
          return null
        }
        return {
          conversion: convertEmojiElement,
          priority: 2
        }
      }
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span")
    element.setAttribute("data-lexical-emoji-text", this.__text)
    element.setAttribute(
      "data-lexical-emoji-items",
      JSON.stringify(this.__items)
    )
    return { element }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const elem = document.createElement("span")
    elem.style.display = "inline-block"
    return elem
    const dom = document.createElement("span")
    const inner = super.createDOM(config)
    dom.className = this.__className
    dom.classList.add(`key_emoji_${this.__emoji_key}`)
    inner.className = "emoji-inner"

    dom.style.borderRadius = "8px"
    inner.style.color = "white"
    dom.style.background =
      " linear-gradient(95deg, #000 -2.16%, rgba(0, 0, 0, 0.42) 60.51%)"
    dom.style.padding = "3px 8px"
    dom.style.gap = "16px"
    dom.style.display = "inline-flex"
    dom.style.alignItems = "center"

    // dom.addEventListener("mousedown", (e) => {
    //   console.log("e: ", "clicked ", e)
    //   // @ts-ignore
    //   // e.preventDefault()
    //   // e.stopPropagation()
    //   return false

    // })
    dom.appendChild(inner)

    const spanElement = document.createElement("span")

    spanElement.style.gap = "8px"
    spanElement.style.display = "flex"
    spanElement.style.alignItems = "center"
    const buttonEdit = document.createElement("button")
    const buttonRemove = document.createElement("button")

    buttonEdit.type = "button"
    buttonRemove.type = "button"
    buttonEdit.onclick = this.handleEdit
    buttonRemove.onclick = this.handleRemoveItem
    buttonEdit.innerHTML = editSvg
    buttonRemove.innerHTML = removeSvg
    spanElement.appendChild(buttonEdit)
    spanElement.appendChild(buttonRemove)
    dom.appendChild(spanElement)
    this.__chip = dom
    dom.contentEditable = "false"
    // dom.focus()
    dom.setAttribute("data-lexical-decorator", "true")

    // dom.style.display = "inline-block"
    return dom
  }

  updateDOM() // prevNode: TextNode,
  // dom: HTMLElement,
  // config: EditorConfig
  : boolean {
    // const inner = dom.firstChild
    // if (inner === null) {
    //   return true
    // }
    // super.updateDOM(prevNode, inner as HTMLElement, config)
    return false
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    const node = $createEmojiNode(
      serializedNode.className,
      serializedNode.text,
      serializedNode.items
    )
    node.setFormat(serializedNode.format)
    node.setDetail(serializedNode.detail)
    node.setMode(serializedNode.mode)
    node.setStyle(serializedNode.style)
    return node
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      className: this.getClassName(),
      items: this.__items,
      type: "emoji"
    }
  }

  getClassName(): string {
    const self = this.getLatest()
    return self.__className
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <TextComponent
          className={this.__className}
          nodeKey={this.__key}
          text={this.__text}
        />
      </Suspense>
    )
  }
}

export function $isEmojiNode(
  node: LexicalNode | null | undefined
): node is EmojiNode {
  return node instanceof EmojiNode
}

export function $createEmojiNode(
  className: string,
  emojiText: string,
  items: DataListType[]
): EmojiNode {
  return new EmojiNode(className, emojiText, items).setMode("token")
}
