import axios from "axios"

export async function evaluateProfile(
  extractedProfile,
  jobDescription,
  callback
) {
  axios
    .post("http://localhost:3000/evaluation", {
      vc: extractedProfile.positions,
      jobDescription: jobDescription
    })
    .then((response: any) => {
      console.log(
        "the evaluation for ",
        extractedProfile.personal.name,
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
