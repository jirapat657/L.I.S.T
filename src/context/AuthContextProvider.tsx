import { auth, db } from '@/services/firebase' // <-- ปรับชื่อ FirebaseApp ตามที่คุณตั้งไว้
import type { UserData } from '@/types/users'
import type { User as FirebaseUser } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, Timestamp, type DocumentData } from 'firebase/firestore'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './AuthContext'

export type TCurrentUser =
  | {
      user: FirebaseUser
      profile: UserData
      accessToken: string
    }
  | null
  | undefined

export type AuthContextType = {
  currentUser: TCurrentUser
  loading: boolean
}

async function getUserProfileFromCloudFunction(): Promise<UserData | null> {
  try {
    const uid = auth?.currentUser?.uid
    const userProfileColelctionRef: DocumentData = await getDoc(doc(db, 'LIMUsers', uid ?? ''))

    return { ...userProfileColelctionRef.data(), uid: uid }
  } catch (error) {
    console.log('errorAuthContextProvider:', error)
    // ถ้าไม่พบ user หรือ error อื่น ๆ
    return null
  }
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<TCurrentUser>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // เช็ก email ก่อนเรียก cloud function
        if (!user.email) {
          // fallback profile สำหรับ user ที่ไม่มี email
          setCurrentUser({
            user,
            profile: {
              userId: user.uid,
              userName: '',
              email: '',
              role: '',
              jobPosition: '',
              status: 'Active',
              createdAt: Timestamp.fromDate(new Date()),
              uid: '',
            },
            accessToken: await user.getIdToken(),
          })
          setLoading(false)
          return
        }

        try {
          // มี email แล้วค่อยเรียก cloud function
          const [rawUserData, getToken] = await Promise.all([
            getUserProfileFromCloudFunction(),
            user.getIdToken(),
          ])

          let profile: UserData

          if (rawUserData) {
            profile = {
              ...rawUserData,
              createdAt: rawUserData.createdAt
                ? rawUserData.createdAt
                : Timestamp.fromDate(new Date()),
            }
          } else {
            profile = {
              userId: user.uid,
              userName: '',
              email: user.email,
              role: '',
              jobPosition: '',
              status: 'Active',
              createdAt: Timestamp.fromDate(new Date()),
              uid: '',
            }
          }

          setCurrentUser({
            user,
            profile,
            accessToken: getToken,
          })
        } catch (error) {
          console.error('Error fetching user data:', error)

          const getToken = await user.getIdToken()
          const fallbackProfile: UserData = {
            userId: user.uid,
            userName: '',
            email: user.email ?? '',
            role: '',
            jobPosition: '',
            status: 'Active',
            createdAt: Timestamp.fromDate(new Date()),
            uid: '',
          }

          setCurrentUser({
            user,
            profile: fallbackProfile,
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
