// src/context/AuthContextProvider.tsx

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { auth, FirebaseApp } from "@/services/firebase"; // <-- ปรับชื่อ FirebaseApp ตามที่คุณตั้งไว้
import { getFunctions, httpsCallable } from "firebase/functions";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserData } from "@/types/users";

export type TCurrentUser =
  | ({
      user: FirebaseUser;
      profile: UserData;
      accessToken: string;
    })
  | null
  | undefined;


export type AuthContextType = {
  currentUser: TCurrentUser;
  loading: boolean;
};

type GetUserByEmailResult = { profile: UserData | null };

async function getUserProfileFromCloudFunction(email: string): Promise<UserData | null> {
  try {
    const functions = getFunctions(FirebaseApp);
    const getUser = httpsCallable<
      { email: string },      // input type
      GetUserByEmailResult    // output type
    >(functions, 'getUserByEmail');
    const result = await getUser({ email });
    console.log("Cloud Function result:", result.data); // ดู structure
    console.log("Firestore profile (result.data.profile):", result.data?.profile);
    
    // ปรับโครงสร้างตาม Cloud Function ที่คุณเขียน
    return result.data?.profile ?? null;
  } catch (error) {
    console.log("errorAuthContextProvider:",error)
    // ถ้าไม่พบ user หรือ error อื่น ๆ
    return null;
  }
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<TCurrentUser>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
        // เช็ก email ก่อนเรียก cloud function
        console.log("userrrr",user)
        if (!user.email) {
            // fallback profile สำหรับ user ที่ไม่มี email
            setCurrentUser({
            user,
            profile: {
                id: user.uid,
                userId: user.uid,
                userName: "",
                email: "",
                role: "",
                jobPosition: "",
                status: "Active",
                createdAt: Timestamp.fromDate(new Date()),
                uid: "",
            },
            accessToken: await user.getIdToken(),
            });
            setLoading(false);
            return;
        }

        try {
            // มี email แล้วค่อยเรียก cloud function
            const [rawUserData, getToken] = await Promise.all([
            getUserProfileFromCloudFunction(user.email),
            user.getIdToken(),
            ]);

            let profile: UserData;

            if (rawUserData) {
            profile = {
                ...rawUserData,
                createdAt: rawUserData.createdAt
                ? rawUserData.createdAt
                : Timestamp.fromDate(new Date()),
            };
            } else {
            profile = {
                id: user.uid,
                userId: user.uid,
                userName: "",
                email: user.email,
                role: "",
                jobPosition: "",
                status: "Active",
                createdAt: Timestamp.fromDate(new Date()),
                uid: "",
            };
            }

            setCurrentUser({
            user,
            profile,
            accessToken: getToken,
            });
        } catch (error) {
            console.error("Error fetching user data:", error);

            const getToken = await user.getIdToken();
            const fallbackProfile: UserData = {
            id: user.uid,
            userId: user.uid,
            userName: "",
            email: user.email ?? "",
            role: "",
            jobPosition: "",
            status: "Active",
            createdAt: Timestamp.fromDate(new Date()),
            uid: "",
            };

            setCurrentUser({
            user,
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
