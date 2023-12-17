import { ActionTypes } from "~src/types"

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

export function getEvaluationFromIndexedDB(
  projectId,
  jobDescriptionId,
  profileId
) {
  return new Promise((resolve, reject) => {
    chrome.runtime
      .sendMessage({
        action: ActionTypes.GET_EVALUATION,
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

export function getEvaluationsAverageFromIndexedDB(
  projectId,
  jobDescriptionId
) {
  return new Promise((resolve, reject) => {
    chrome.runtime
      .sendMessage({
        action: ActionTypes.GET_EVALUATIONS_AVERAGE,
        payload: { projectId, jobDescriptionId }
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

export function updateDataFromIndexedDB(data) {
  return new Promise((resolve, reject) => {
    chrome.runtime
      .sendMessage({
        action: ActionTypes.UPDATE_DATA,
        payload: data
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
