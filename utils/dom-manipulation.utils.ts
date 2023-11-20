export function injectDataIntoDom(profile: Element, profileEvaluation) {
  const rating = profileEvaluation.data.rating
  const explanation = profileEvaluation.data.explanation
  // Inject response into DOM
  const targetElement = profile.querySelector(
    ".profile-list__border-bottom .history-group"
  ) // Adjust the selector as necessary

  const injectedDataHtml = `
        <div style="margin-top: 20px; padding: 16px; background-color: #f3f6f8; border-radius: 8px; border: 1px solid #dce0e0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <div style="font-weight: 800; font-size: 16px; color: #303030; margin-bottom: 8px;">Rating: ${rating}</div>
          <div style="font-weight: 600; font-size: 14px; color: #303030; margin-bottom: 8px;">Role Fit Rating Explained</div>
          <div style="font-size: 14px; line-height: 1.5; color: #303030;">${explanation}</div>
        </div>
      `

  // Insert the HTML snippet after the target element
  targetElement.insertAdjacentHTML("afterend", injectedDataHtml)
}
