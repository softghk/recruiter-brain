import { waitForElement } from "./wait-for.utils"

export async function addOverlay() {
  const logoSrc = "https://i.ibb.co/DDZFTbv/logo.png" // Replace with your logo image

  // Create a div element for the overlay
  const overlay = document.createElement("div")
  overlay.style.position = "fixed"
  overlay.style.top = "0"
  overlay.style.left = "0"
  overlay.style.width = "100%"
  overlay.style.height = "100%"
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)" // Semi-transparent dark background
  overlay.style.display = "flex"
  overlay.style.justifyContent = "center"
  overlay.style.alignItems = "center"
  overlay.style.zIndex = "9999" // Ensure it's above other content

  // Create a container for the content
  const contentContainer = document.createElement("div")
  contentContainer.style.backgroundColor = "#fff" // Light background for content
  contentContainer.style.padding = "20px"
  contentContainer.style.borderRadius = "10px"
  contentContainer.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)"
  contentContainer.style.maxWidth = "80%"

  // Create an image element for the logo
  const logo = document.createElement("img")
  logo.src = logoSrc
  logo.style.maxWidth = "150px" // Customize the logo size as needed
  logo.style.display = "block" // Center the logo

  // Create a div element for the text
  const textDiv = document.createElement("div")
  textDiv.style.color = "#333" // Customize text color
  textDiv.style.marginTop = "20px" // Add spacing above the text
  textDiv.innerHTML = `<h3><strong>Please wait while we process your request.</strong></h3>
  <div style="padding:20px;" id="brain-info">
    <ul>
      <li>Do not close this tab.</li>
      <li>Once the process is complete, this tab will close automatically.</li>
      <li>You can use the browser as usual in the meantime.</li>
      <li id="lastListItem"><b>Please wait for the indicator to turn green before changing tabs: </b></li>
      <li><b>Recommended: Keep this tab open for faster processing.</b></li>
    </ul>
  </div>`

  // Append the logo and textDiv to the content container
  contentContainer.appendChild(logo)
  contentContainer.appendChild(textDiv)

  // Append the content container to the overlay
  overlay.appendChild(contentContainer)

  // Append the overlay to the body of the page
  document.body.appendChild(overlay)

  // Create a red circle element
  const redCircle = document.createElement("span")
  redCircle.style.height = "15px"
  redCircle.style.width = "15px"
  redCircle.style.backgroundColor = "red"
  redCircle.style.borderRadius = "50%"
  redCircle.style.display = "inline-block"
  redCircle.style.marginRight = "5px"

  // Get the last list item and add the red circle
  const lastListItem = document.getElementById("lastListItem")
  lastListItem.appendChild(redCircle)

  // Wait for the element and change the red circle to green
  await waitForElement("a[data-live-test-link-to-profile-link]")
  redCircle.style.backgroundColor = "green"
}
