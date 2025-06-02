import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/services/firebase';
import { getUserByEmail } from '@/api/user'; // ✅ เปลี่ยนจาก getDocumentByDocId
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserData } from '@/types/users';

// ---------- Custom Types ----------
export type TCurrentUser =
  | (FirebaseUser & {
      profile: UserData;
      accessToken: string;
    })
  | null
  | undefined;

type AuthContextType = {
  currentUser: TCurrentUser;
  loading: boolean;
};

// ---------- Initial Values ----------
const initialState: AuthContextType = {
  currentUser: undefined,
  loading: true,
};

// ---------- Context ----------
export const AuthContext = createContext<AuthContextType>(initialState);
export const useAuthContext = () => useContext(AuthContext);

// ---------- Provider ----------
export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<TCurrentUser>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [rawUserData, getToken] = await Promise.all([
            getUserByEmail(user.email ?? ''), // ✅ ดึงจาก email
            user.getIdToken(),
          ]);

          console.log('[🔥] rawUserData from Firestore:', rawUserData);

          if (!rawUserData) throw new Error('No Firestore user found for this email');

          const profile: UserData = {
            id: rawUserData.id,
            userId: rawUserData.userId,
            userName: rawUserData.userName,
            email: rawUserData.email,
            role: rawUserData.role,
            jobPosition: rawUserData.jobPosition,
            status: rawUserData.status,
            createdAt: rawUserData.createdAt ?? Timestamp.fromDate(new Date()),
          };

          setCurrentUser({
            ...user,
            profile,
            accessToken: getToken,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);

          const getToken = await user.getIdToken();

          const fallbackProfile: UserData = {
            id: user.uid,
            userId: user.uid,
            userName: '',
            email: user.email ?? '',
            role: '',
            jobPosition: '',
            status: 'Active',
            createdAt: Timestamp.fromDate(new Date()),
          };

          setCurrentUser({
            ...user,
            profile: fallbackProfile,
            accessToken: getToken,
          });
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ currentUser, loading }), [currentUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
