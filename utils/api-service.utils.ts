import axios from "axios"

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
