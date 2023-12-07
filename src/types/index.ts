export type AuthState = {
  isAuth: boolean
  email: string
  accessToken: string
  refreshToken: string
}

export const AuthInitialState: AuthState = {
  isAuth: false,
  email: "",
  accessToken: "",
  refreshToken: ""
}

export type UserCredential = {
  email: string
  password: string
  passwordConfirm?: string
}

export type JobSettings = {
  title: string
  description: string
  searchLimit?: number
  autoAdd?: boolean
}

export const JobInitialSetting: JobSettings = {
  title: "",
  description: "",
  searchLimit: 0,
  autoAdd: false
}

export type CandidateRating = {
  experience: number
  education: number
  skills: number
  overall: number
}

export const CandidateInitialRating: CandidateRating = {
  experience: 0,
  education: 0,
  skills: 0,
  overall: 0
}
