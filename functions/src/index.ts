import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
admin.initializeApp();

export const createUser = functions.https.onRequest(async (req, res) => {
  console.log("REQUEST BODY:", req.body);

  const {
    email,
    password,
    userName,
    jobPosition,
    role,
    status,
    userId,
  } = req.body;

  // เพิ่ม log ตรงนี้เพื่อดูแต่ละ field
  console.log("FIELDS", {
    email, password, userName, jobPosition, role, status, userId
  });

  // Validate fields
  if (!email || !password || !userName || !jobPosition || !role || !status || !userId) {
    console.log("Missing required fields!", req.body);
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  console.log("START TRY");

  try {
    // สร้าง user ใน Firebase Auth
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: userName,
    });

    // Log ก่อนเขียน Firestore
    console.log('BEFORE WRITE FIRESTORE', user.uid);

    // บันทึกข้อมูลลง Firestore
    await admin.firestore().collection("LIMUsers").doc(user.uid).set({
      email,
      userName,
      jobPosition,
      role,
      status,
      userId,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Log หลังเขียน Firestore
    console.log('AFTER WRITE FIRESTORE', user.uid);

    res.status(201).json({ uid: user.uid });
  } catch (err: any) {
    console.error("CREATE_USER_ERROR", err);
    // ตอบ error email ซ้ำ
    if (err.code === 'auth/email-already-exists') {
      res.status(400).json({ message: "Email already in use" });
      return;
    }
    res.status(500).json({ message: err.message || "Failed to create user", error: err });
  }

  console.log("END OF HANDLER");
});
