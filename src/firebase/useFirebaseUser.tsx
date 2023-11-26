// src/firebase/useFirebaseUser.tsx

import {
  type User,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence
} from "firebase/auth"
import { useEffect, useState } from "react"
import { useStorage } from '@plasmohq/storage/hook'
import { auth } from "./firebaseClient"
import { AuthInitialState, type AuthState } from "src/types"
import { AUTH_STATE } from "src/config/storage.config"

setPersistence(auth, browserLocalPersistence)

export default function useFirebaseUser() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User>(null)
  const [userInfo, setUserInfo] = useStorage<AuthState>(AUTH_STATE, AuthInitialState)

  const onLogout = async () => {
    setIsLoading(true)
    if (user) {
      await auth.signOut()
      setUserInfo(AuthInitialState)
    }
  }

  const onLogin = () => {
    if (!user) return

    const uid = user.uid

    // Get current user auth token
    user.getIdToken(true).then(async (token) => {
      setUserInfo({
        email: user.email,
        accessToken: token,
        refreshToken: user.refreshToken,
        isAuth: true
      })
    })
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsLoading(false)
      setUser(user)
    })
  }, [])

  useEffect(() => {
    if (user) {
      onLogin()
    }
  }, [user])

  return {
    isLoading,
    user,
    onLogin,
    onLogout
  }
}