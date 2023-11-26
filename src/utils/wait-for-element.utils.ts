export function waitForElement(selector, callback) {
  // Initial check if the element is already present
  let element = document.querySelector(selector)
  if (element) {
    callback(element)
    return
  }

  // Set up the MutationObserver
  let observer = new MutationObserver(function (mutations, me) {
    let element = document.querySelector(selector)
    if (element) {
      callback(element)
      me.disconnect() // Stop observing
      return
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}
