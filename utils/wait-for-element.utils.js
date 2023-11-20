export function waitForElement(selector, callback) {
  let observer = new MutationObserver(function (mutations, me) {
    let element = document.querySelector(selector)
    if (element) {
      callback(element)
      me.disconnect() // Stop observing
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}
