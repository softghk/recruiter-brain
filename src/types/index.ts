export type AuthState = {
  isAuth: boolean,
  email: string
  accessToken: string,
  refreshToken: string,
}

export const AuthInitialState: AuthState = {
  isAuth: false,
  email: '',
  accessToken: '',
  refreshToken: ''
}

export type UserCredential = {
  email: string,
  password: string,
  passwordConfirm?: string
}

export type JobSettings = {
  description: string,
  searchLimit: number,
  autoAdd: boolean
}

export const JobInitialSetting: JobSettings = {
  description: '',
  searchLimit: 20,
  autoAdd: false
}