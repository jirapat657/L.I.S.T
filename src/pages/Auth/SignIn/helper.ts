import { auth } from "@/services/firebase";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";

type FormValues = {
  email: string;
  password: string;
};
const FIREBASE_ERRORS = {
  "auth/email-already-in-use": "A user with that email already exists",
  "auth/weak-password":
    "Please check your password. It should be 6+ characters",
  "auth/user-not-found": "Invalid email or password",
  "auth/wrong-password": "Invalid email or password",
  "auth/invalid-credential": "Invalid email or password",
};

export const onSubmit = async ({ email, password }: FormValues) => {
  try {
    // this is a trick to resolve the issue to resolve the authStateChanged when user verifies their email and login then it doesnot changes as it is same as signup
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (userCredential.user) {
      return userCredential.user;
    }
  } catch (error: unknown) {
    const err = error as FirebaseError;
    return toast.error(
      FIREBASE_ERRORS[err.code as keyof typeof FIREBASE_ERRORS]
    );
  }
};
