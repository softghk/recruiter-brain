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

export const ActionTypes = {
  EVALUATE_PROFILES: "evaluate-profiles",
  GET_STATUS: "get-status",
  PAUSE_JOB: "pause-job",
  RESUME_JOB: "resume-job",
  STOP_JOB: "stop-job",
  TASK_DATA_RECEIVED: "task-data-received",
  GET_JOB_DETAILS: "get-job-details",
  CLOSE_TAB: "close-tab",
  CLEAR_PROJECT_DATA: "clear-project-data",
  DELETE_ALL_DATABASE: "delete-all-dbs",
  GET_EVALUATION: "get-data-from-indexed-db",
  UPDATE_DATA: "update-data-from-indexed-db",
  GET_EVALUATIONS_AVERAGE: "get-evaluations-average-from-indexed-db",
  CREATE_DATABASE: "createDatabase",
  ITEM_ADDED: "item-added-to-indexed-db",
  SWITCH_BACK_TO_MAIN_TAB: "switch-back-to-main-tab"
}

export interface JobData {
  amount: number
  href: string
  jobDescription: string
  jobDescriptionId: string
  jobId: number
  jobTitle: string
  projectId: string
  searchConextId: string
  taskId: number
}

export interface Task {
  id: number // or string, depending on your ID type
  status: JobStatus
}

export enum JobStatus {
  PENDING = "pending",
  COMPLETE = "complete",
  FAILED = "failed",
  PAUSED = "paused",
  STOPPED = "stopped"
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
