import axios from "axios"
import { AUTH_STATE } from "src/config/storage.config"
import type { AuthState } from "src/types"

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export async function evaluateProfileApi(profileUrl, profile, jobDescription) {
  const firebaseAuth: AuthState = await storage.get(AUTH_STATE)
  const accessToken = firebaseAuth.accessToken
  return new Promise((resolve, reject) => {
    fetch("http://localhost:3000/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken
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
        resolve(data)
      })
      .catch((error) => {
        console.log("error during evaluation", error)
        reject(error)
      })
  })
}

export async function rateCandidateEvaluation(profileUrl, evaluationRating) {
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
        profileUrl: profileUrl,
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
    console.log(data)
    axios
      .get(`http://localhost:3000/users/stats`, {
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
