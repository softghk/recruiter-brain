import buildDataHTML from "src/ui-components/profile-evaluation.component"

// Injects data into the DOM after profile evaluation
export function injectDataIntoDom(profile, profileEvaluation) {
  removeLoadingIndicator(profile)

  const { rating, explanation } = profileEvaluation.data

  const targetElement = profile.querySelector(".artdeco-entity-lockup")

  if (targetElement) {
    /*
    targetElement.insertAdjacentHTML(
      "afterend",
      buildDataHTML(rating, explanation)
    )
    */
    targetElement.after(buildDataHTML(rating, explanation))
  } else {
    console.error("Target element for injecting data not found.")
  }
}

// Removes the loading indicator
function removeLoadingIndicator(profile) {
  const loadingIndicator = profile.querySelector(".loading-indicator")
  if (loadingIndicator) {
    loadingIndicator.remove()
  }
}

// Injects a loading notice into the DOM
export function injectWaitingNoticeIntoDom(profile) {
  const targetElement = profile.querySelector(
    ".profile-list__border-bottom .history-group"
  )

  if (targetElement) {
    const loadingHtml = buildLoadingHtml()
    targetElement.insertAdjacentHTML("afterend", loadingHtml)
  } else {
    console.error("Target element for injecting data not found.")
  }
}

// Builds HTML string for loading indicator
function buildLoadingHtml() {
  return `
    <div class="loading-indicator" style="position: relative; margin-top: 20px; padding: 16px; background-color: #f3f6f8; border-radius: 8px; border: 1px solid #dce0e0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); display: flex; justify-content: center; align-items: center;">
      <img src="https://i.ibb.co/MVCGgq2/logo.png" alt="Logo" style="position: absolute; top: 10px; right: 10px; width: 30px; height: auto;">
      <div style="text-align: center;">
        <div class="circular-loader"></div>
        <p style="margin-top: 10px;">Analyzing VC...</p>
      </div>
    </div>
  `
}

// Injects CSS styles for overlay and loading animation into the document
function injectStyles() {
  const styles = `
    @keyframes spinner {
      to { transform: rotate(360deg); }
    }
    .circular-loader {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid #0078D4;
      width: 24px;
      height: 24px;
      animation: spinner 1s linear infinite;
      margin: 0 auto;
      margin-bottom: 10px;
    }
    #scanningOverlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      text-align: center;
    }
    #scanningOverlay img {
      width: 60px;
      height: auto;
      margin-bottom: 20px;
    }
    #scanningOverlay p {
      color: white;
      font-size: 24px;
      font-weight: bold;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.7;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .overlayLogo {
        animation: pulse 1.5s infinite;
    }
  `

  const styleTag = document.createElement("style")
  styleTag.appendChild(document.createTextNode(styles))
  document.head.appendChild(styleTag)
}

injectStyles() // Call this as soon as possible, ideally when the script starts

// Overlay creation and removal
export function createOverlay() {
  const overlayHtml = `
    <div id="scanningOverlay">
      <div>
        <img src="https://i.ibb.co/9H8kg2n/logo-dark.png" alt="Logo" class="overlayLogo">
        <p>Scanning candidates</p>
      </div>
    </div>
  `
  document.body.insertAdjacentHTML("beforeend", overlayHtml)
}

export function removeOverlay() {
  const overlay = document.getElementById("scanningOverlay")
  if (overlay) {
    overlay.remove()
  }
}
