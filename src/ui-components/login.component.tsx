import { Box } from '@mui/material'
import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '~src/firebase/firebaseClient'

import { AmplifyLoginView } from '@minimal/sections/auth/amplify'
import { type UserCredential } from 'src/types'
import useFirebaseUser from 'src/firebase/useFirebaseUser'

const Login = () => {

  const { onLogin } = useFirebaseUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const onSubmitLogin = async (data: UserCredential) => {

    try {
      setIsSubmitting(true)
      await signInWithEmailAndPassword(auth, data.email, data.password)

    } catch (error) {

      switch (error.code) {
        case 'auth/invalid-login-credentials':
          setErrorMsg('Invalid email or password')
          break
        default:
          setErrorMsg('Unknown error occured')
          break;
      }

    } finally {
      onLogin()
    }

    setIsSubmitting(false)
  }

  return (
    <Box width={343}>
      <AmplifyLoginView onSubmit={onSubmitLogin} isSubmitting={isSubmitting} errorMsg={errorMsg} />
    </Box>
  )
}

export default Login