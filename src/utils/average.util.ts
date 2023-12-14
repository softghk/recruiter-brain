export function calculateAverageRatings(data) {
  let totalExperience = 0,
    totalEducation = 0,
    totalSkills = 0,
    totalOverall = 0
  let count = data.length

  data.forEach((item) => {
    totalExperience += item.evaluation.rating.experience
    totalEducation += item.evaluation.rating.education
    totalSkills += item.evaluation.rating.skills
    totalOverall += item.evaluation.rating.overall
  })

  return {
    experience: totalExperience / count,
    education: totalEducation / count,
    skills: totalSkills / count,
    overall: totalOverall / count
  }
}
