import * as admin from "firebase-admin";
admin.initializeApp();

export { createUser } from "./createUser";
export { updateUserPasswordByAdmin } from "./updateUserPasswordByAdmin";
