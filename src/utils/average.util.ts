export function calculateAverageRatings(data) {
  let totalExperience = 0,
    totalEducation = 0,
    totalSkills = 0,
    totalOverall = 0
  let count = data.length

  data.forEach((item) => {
    totalExperience += (item.evaluation.rating?.experience || 0)
    totalEducation += (item.evaluation.rating?.education || 0)
    totalSkills += (item.evaluation.rating?.skills || 0)
    totalOverall += (item.evaluation.rating?.overall || 0)
  })

  return {
    experience: totalExperience / count,
    education: totalEducation / count,
    skills: totalSkills / count,
    overall: totalOverall / count
  }
}
