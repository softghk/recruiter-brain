import axios from "axios"
import { Storage } from '@plasmohq/storage'
import { AUTH_STATE } from "src/config/storage.config"
import type { AuthState } from "src/types"

const storage = new Storage()

export async function evaluateProfile(
  profileUrl,
  profile,
  jobDescription,
  callback
) {
  axios
    .post("http://localhost:3000/evaluation", {
      vc: profile.positions,
      jobDescription: jobDescription,
      profileUrl: profileUrl
    })
    .then((response: any) => {
      console.log(
        "the evaluation for ",
        profile.personal.name,
        " is ",
        response.data.rating,
        response.data.explanation
      )
      callback(response)
    })
    .catch((error) => {
      console.log("error during evaluation")
    })
}

export async function getStatisticData() {
  return new Promise(async (resolve, reject) => {
    const data: AuthState = await storage.get(AUTH_STATE)
    console.log(data)
    axios.get(`https://jsonplaceholder.typicode.com/posts`, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`
      }
    })
      .then(resp => {
        resolve(resp.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}