import toast from 'react-hot-toast'
import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail } from 'firebase/auth'

import { auth } from '@/services/firebase'

type FormValues = {
  email: string
}

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'A user with that email already exists',
  'auth/weak-password': 'Please check your password. It should be 6+ characters',
  'auth/user-not-found': 'Invalid email or password',
  'auth/wrong-password': 'Invalid email or password',
  'auth/invalid-credential': 'Invalid email or password',
}

export async function onSubmit({ email }: FormValues) {
  try {
    await sendPasswordResetEmail(auth, email)
    return toast.success('Link for reset password has been Sended')
  } catch (error: unknown) {
    const err = error as FirebaseError
    return toast.error(FIREBASE_ERRORS[err.code as keyof typeof FIREBASE_ERRORS])
  }
}
