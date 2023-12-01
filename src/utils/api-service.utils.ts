import axios from "axios"
import { AUTH_STATE } from "src/config/storage.config"
import type { AuthState } from "src/types"

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export async function evaluateProfileApi(
  profileUrl,
  profile,
  jobDescription,
  callback
) {
  fetch("http://localhost:3000/evaluation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      vc: profile.positions,
      jobDescription: jobDescription,
      profileUrl: profileUrl
    })
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(
        "the evaluation for ",
        profile.personal.name,
        " is ",
        data.rating,
        data.explanation
      )
      callback(data)
    })
    .catch((error) => {
      console.log("error during evaluation", error)
    })
}

export async function rateCandidateEvaluation(profileUrl, rating, callback) {
  fetch("http://localhost:3000/evaluation/rating", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      profileUrl: profileUrl,
      rating: rating
    })
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("rated evaluation for")
      callback(data)
    })
    .catch((error) => {
      console.log("error during evaluation", error)
    })
}

export async function getStatisticData() {
  return new Promise(async (resolve, reject) => {
    const data: AuthState = await storage.get(AUTH_STATE)
    console.log(data)
    axios
      .get(`https://jsonplaceholder.typicode.com/posts`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`
        }
      })
      .then((resp) => {
        resolve(resp.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export async function getEvaluationData() {
  return new Promise(async (resolve, reject) => {
    const data: AuthState = await storage.get(AUTH_STATE)
    axios
      .get(`https://jsonplaceholder.typicode.com/posts`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`
        }
      })
      .then((resp) => {
        resolve(resp.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
