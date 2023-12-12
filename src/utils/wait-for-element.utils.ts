export async function waitForElement(selector) {
  return new Promise((resolve) => {
    let element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }

    let observer = new MutationObserver(function (mutations, me) {
      let element = document.querySelector(selector)
      if (element) {
        resolve(element)
        me.disconnect() // Stop observing
        return
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })
  })
}
