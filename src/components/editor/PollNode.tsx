/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread
} from "lexical"
import * as React from "react"
import { Suspense } from "react"

import type { DataListType } from "~@minimal/sections/popup/view"

import PollComponent from "./PollComponent"

export type SerializedPollNode = Spread<
  {
    text: string
    items: DataListType[]
  },
  SerializedLexicalNode
>

function convertPollElement(domNode: HTMLElement): DOMConversionOutput | null {
  const text = domNode.getAttribute("data-lexical-poll-text")
  const items = domNode.getAttribute("data-lexical-poll-items")
  if (text !== null && items !== null) {
    const node = $createPollNode(text, JSON.parse(items))
    return { node }
  }
  return null
}

export class PollNode extends DecoratorNode<JSX.Element> {
  __text: string

  static getType(): string {
    return "poll"
  }

  static clone(node: PollNode): PollNode {
    return new PollNode(node.__text, node.__items, node.__key)
  }

  static importJSON(serializedNode: SerializedPollNode): PollNode {
    const node = $createPollNode(serializedNode.text, serializedNode.items)
    serializedNode.items.forEach(node.addOption)
    return node
  }

  constructor(text: string, items: DataListType[], key?: NodeKey) {
    super(key)
    this.__text = text
    this.__items = items
  }

  exportJSON(): SerializedPollNode {
    return {
      items: this.__items,
      text: this.__text,
      type: "poll",
      version: 1
    }
  }

  addOption(item: DataListType): void {
    const self = this.getWritable()
    const items = Array.from(self.__items)
    items.push(item)
    self.__items = items
  }
  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-poll-text")) {
          return null
        }
        return {
          conversion: convertPollElement,
          priority: 2
        }
      }
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span")
    element.setAttribute("data-lexical-poll-text", this.__text)
    element.setAttribute(
      "data-lexical-poll-items",
      JSON.stringify(this.__items)
    )
    return { element }
  }

  createDOM(): HTMLElement {
    const elem = document.createElement("span")
    elem.style.display = "inline-block"
    return elem
  }

  updateDOM(): false {
    return false
  }

  setTextContent(text: string): this {
    if (this.__text === text) {
      return this
    }
    const self = this.getWritable()
    self.__text = text
    return self
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <PollComponent
          text={this.__text}
          items={this.__items}
          nodeKey={this.__key}
          remove={() => this.remove(true)}
          replace={(e) => this.setTextContent(e)}
        />
      </Suspense>
    )
  }
}

export function $createPollNode(text: string, items: DataListType[]): PollNode {
  return new PollNode(text, items)
}

export function $isPollNode(
  node: LexicalNode | null | undefined
): node is PollNode {
  return node instanceof PollNode
}
