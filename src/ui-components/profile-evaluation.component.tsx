import React from "react"
import ReactDOM from "react-dom/client"

import { useStorage } from "@plasmohq/storage/hook"

import { EXTENSION_ENABLE } from "~src/config/storage.config"

const ProfileEvaluation = ({ rating, explanation }) => {
  const [state, setState] = useStorage<boolean>(EXTENSION_ENABLE)

  const formattedExplanation = explanation.replace(/\n/g, "<br>")

  if (!state) return null

  return (
    <div
      style={{
        position: "relative",
        marginTop: 20,
        padding: 16,
        backgroundColor: "#f3f6f8",
        borderRadius: 8,
        border: "1px solid #dce0e0",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        wordWrap: "break-word"
      }}>
      <img
        src="https://i.ibb.co/MVCGgq2/logo.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 30,
          height: "auto"
        }}
      />
      <div
        style={{
          fontWeight: 800,
          fontSize: 16,
          color: "#303030",
          marginBottom: 8
        }}>
        Rating: {rating}
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#303030",
          marginBottom: 8
        }}>
        Role Fit Rating Explained
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "#303030"
        }}
        dangerouslySetInnerHTML={{ __html: formattedExplanation }}></div>
    </div>
  )
}

const profileContainer = (rating, explanation, profileId) => {
  const container = document.createElement("div")
  container.setAttribute("id", `recruit-brain-profile-${profileId}`)
  const shadowContainer = container.attachShadow({ mode: "open" })
  const shadowRootElement = document.createElement("div")
  shadowContainer.appendChild(shadowRootElement)

  const root = ReactDOM.createRoot(shadowRootElement as HTMLElement)
  root.render(<ProfileEvaluation rating={rating} explanation={explanation} />)

  return container
}

export default profileContainer
