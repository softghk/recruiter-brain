// @ts-nocheck
export const getStorageData = (key: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }
      resolve(result[key])
    })
  })
}

export function requestDataFromIndexedDB(
  projectId,
  jobDescriptionId,
  profileId
) {
  return new Promise((resolve, reject) => {
    chrome.runtime
      .sendMessage({
        action: "getDataFromIndexedDB",
        payload: { projectId, jobDescriptionId, profileId }
      })
      .then((response) => {
        if (response.success) {
          resolve(response.data)
        } else {
          console.error("Error retrieving data:", response.error)
          reject(response.error)
        }
      })
  })
}
