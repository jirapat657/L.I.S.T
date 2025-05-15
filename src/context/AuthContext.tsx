import { getDocumentByDocId } from '@/services/database'
import { auth } from '@/services/firebase'
import type { ProfileProps } from '@/types/UserSetting'
import { onAuthStateChanged } from 'firebase/auth'
import React, { createContext, useEffect, useMemo, useState } from 'react'

type InitialState = {
  currentUser: TCurrentUser
  loading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<InitialState>({
  currentUser: null,
  loading: true,
})

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<TCurrentUser>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [getUserData] = await Promise.all([
            getDocumentByDocId<ProfileProps>('UserSetting', user.uid),
          ])

          const getToken = await user.getIdToken()

          setCurrentUser({
            ...user,
            profile: getUserData || {},
            accessToken: getToken,
          })
        } catch (error) {
          console.error('Error fetching user data:', error)
          const getToken = await user.getIdToken()
          setCurrentUser({
            ...user,
            profile: {},
            accessToken: getToken,
          })
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo(() => ({ currentUser, loading }), [currentUser, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
