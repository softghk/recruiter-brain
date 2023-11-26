import axios from "axios"
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'
import type { UserCredential } from "src/types"

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

export async function loginWithEmailAndPassword(data: UserCredential) {
  const auth = getAuth()
  try {
    const resp = await signInWithEmailAndPassword(auth, data.email, data.password)
    console.log(resp)
  } catch (error) {
    console.log(error)
  }
}