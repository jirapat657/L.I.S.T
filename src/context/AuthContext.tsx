//src/context/AuthContext.tsx
import { createContext } from "react";
import type { AuthContextType } from "./AuthContextProvider";

export const AuthContext = createContext<AuthContextType>({
  currentUser: undefined,
  loading: true,
});
