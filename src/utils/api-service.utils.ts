import axios from "axios"
import { AUTH_STATE } from "src/config/storage.config"
import type { AuthState } from "src/types"

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export async function evaluateProfileApi(
  profileId,
  jobDescriptionId,
  profile,
  jobDescription
) {
  const firebaseAuth: AuthState = await storage.get(AUTH_STATE)
  const accessToken = firebaseAuth.accessToken

  console.log("evaluateProfileApi profileUrl", profileId)

  return new Promise((resolve, reject) => {
    fetch("http://localhost:3000/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken
      },
      body: JSON.stringify({
        profileId: profileId,
        jobDescriptionId: jobDescriptionId,
        jobDescription: jobDescription,
        vc: profile
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
        resolve(data)
      })
      .catch((error) => {
        console.log("error during evaluation", error)
        reject(error)
      })
  })
}

export async function rateCandidateEvaluation(
  profileId,
  jobDescriptionId,
  evaluationRating
) {
  const firebaseAuth: AuthState = await storage.get(AUTH_STATE)
  const accessToken = firebaseAuth.accessToken
  return new Promise((resolve, reject) => {
    fetch("http://localhost:3000/evaluation/evaluation-rating", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken
      },
      body: JSON.stringify({
        profileId: profileId,
        jobDescriptionId: jobDescriptionId,
        evaluationRating: evaluationRating
      })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("rated evaluation for")
        resolve(data)
      })
      .catch((error) => {
        console.log("error during evaluation", error)
        reject(error)
      })
  })
}

export async function getStatisticData() {
  const firebaseAuth: AuthState = await storage.get(AUTH_STATE)
  const accessToken = firebaseAuth.accessToken
  return new Promise(async (resolve, reject) => {
    const data: AuthState = await storage.get(AUTH_STATE)
    axios
      .get(`http://localhost:3000/evaluation/daily-stats`, {
        headers: {
          Authorization: `${data.accessToken}`
        }
      })
      .then((resp) => {
        console.log("daily stats", resp.data)
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
          Authorization: `${data.accessToken}`
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
