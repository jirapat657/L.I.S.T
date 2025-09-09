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

/**
 * ดึงโปรไฟล์ผู้ใช้จาก Firestore:
 * - ถ้ามีเอกสาร -> คืนค่า UserData พร้อม id = docSnap.id และ uid = currentUser.uid
 * - ถ้าไม่มี -> คืน null
 */
async function getUserProfileFromCloudFunction(): Promise<UserData | null> {
  try {
    const uid = auth?.currentUser?.uid
    if (!uid) return null

    const snap = await getDoc(doc(db, 'LIMUsers', uid))
    if (!snap.exists()) return null

    const data = snap.data() as DocumentData

    // สร้างให้ครบฟิลด์ที่จำเป็นตาม UserData
    const userData: UserData = {
      id: snap.id, // ★ สำคัญ: ใช้ docSnap.id เป็น id
      userId: data.userId ?? uid,
      userName: data.userName ?? '',
      email: data.email ?? '',
      role: data.role ?? '',
      jobPosition: data.jobPosition ?? '',
      status: (data.status as UserData['status']) ?? 'Active',
      createdAt: data.createdAt ?? Timestamp.now(),
      uid, // ★ ให้ชัดเจน: uid ของผู้ใช้
    }

    return userData
  } catch (error) {
    console.log('errorAuthContextProvider:', error)
    return null
  }
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<TCurrentUser>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // กรณีไม่มี email — ทำ fallback profile แต่ต้องมี id และ uid ให้ครบ
        if (!user.email) {
          setCurrentUser({
            user,
            profile: {
              id: user.uid,               // ★ เพิ่ม
              userId: user.uid,
              userName: '',
              email: '',
              role: '',
              jobPosition: '',
              status: 'Active',
              createdAt: Timestamp.now(),
              uid: user.uid,              // ★ อย่าให้เป็น ''
            },
            accessToken: await user.getIdToken(),
          })
          setLoading(false)
          return
        }

        try {
          // มี email แล้วค่อยดึงข้อมูล + token พร้อมกัน
          const [rawUserData, getToken] = await Promise.all([
            getUserProfileFromCloudFunction(),
            user.getIdToken(),
          ])

          let profile: UserData

          if (rawUserData) {
            // จากฐานข้อมูล: ensure id/uid/createdAt
            profile = {
              ...rawUserData,
              id: rawUserData.id ?? user.uid,                 // ★ สำรอง
              uid: rawUserData.uid ?? user.uid,               // ★ สำรอง
              createdAt: rawUserData.createdAt ?? Timestamp.now(),
            }
          } else {
            // ไม่มีเอกสาร → fallback
            profile = {
              id: user.uid,                                   // ★ เพิ่ม
              userId: user.uid,
              userName: '',
              email: user.email,
              role: '',
              jobPosition: '',
              status: 'Active',
              createdAt: Timestamp.now(),
              uid: user.uid,                                  // ★ อย่าให้เป็น ''
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
            id: user.uid,                                     // ★ เพิ่ม
            userId: user.uid,
            userName: '',
            email: user.email ?? '',
            role: '',
            jobPosition: '',
            status: 'Active',
            createdAt: Timestamp.now(),
            uid: user.uid,                                    // ★ อย่าให้เป็น ''
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
