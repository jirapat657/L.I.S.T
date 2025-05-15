import { ProfileProps } from "@/types/UserSetting";
import { User } from "firebase/auth";

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare global {
  type TCurrentUser =
    | (User & { profile?: Partial<ProfileProps>; accessToken: string })
    | null
    | undefined;
}
