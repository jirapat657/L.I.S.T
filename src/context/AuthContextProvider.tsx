import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/services/firebase";
import { getUserByEmail } from "@/api/user";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserData } from "@/types/users";

export type TCurrentUser =
  | (FirebaseUser & {
      profile: UserData;
      accessToken: string;
    })
  | null
  | undefined;

export type AuthContextType = {
  currentUser: TCurrentUser;
  loading: boolean;
};

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<TCurrentUser>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [rawUserData, getToken] = await Promise.all([
            getUserByEmail(user.email ?? ""),
            user.getIdToken(),
          ]);

          if (!rawUserData) throw new Error("No Firestore user found for this email");

          const profile: UserData = {
            id: rawUserData.id,
            userId: rawUserData.userId,
            userName: rawUserData.userName,
            email: rawUserData.email,
            role: rawUserData.role,
            jobPosition: rawUserData.jobPosition,
            status: rawUserData.status,
            createdAt: rawUserData.createdAt ?? Timestamp.fromDate(new Date()),
            uid: "",
          };

          setCurrentUser({
            ...user,
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
