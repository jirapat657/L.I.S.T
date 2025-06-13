import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

const app = express();

// 1. เปิด CORS ครอบทุก request
app.use(cors({ origin: true }));
app.use(express.json());

// 2. ใส่ header CORS ทุกกรณี กันพลาด
app.options("*", cors({ origin: true }), (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); // หรือจะใส่ origin ของ frontend ก็ได้
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

// 3. รองรับ preflight OPTIONS ทุก path (สำคัญมาก!)
app.options("*", cors({ origin: true }));

// 4. Main route (POST)
app.post("/", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  // 1. log ว่า function ถูกเรียก
  console.log(">> [POST] /updateUserPasswordByAdmin called!");

  // 2. log body ที่รับมา
  console.log("BODY:", req.body);

  // 3. log auth header
  console.log("AUTH HEADER:", req.headers.authorization);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Missing Authorization header");
    return res.status(401).json({ message: "Missing Authorization header" });
  }
  const idToken = authHeader.replace("Bearer ", "");

  try {
    // 4. log หลัง verify token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("DecodedToken:", decodedToken);

    if (decodedToken.role !== "Admin") {
      console.log("Permission denied, not admin");
      return res.status(403).json({ message: "Permission denied (not admin)" });
    }

    const { uid, newPassword, firestoreData } = req.body;

    if (!uid || !newPassword) {
      console.log("Missing uid or newPassword", { uid, newPassword });
      return res.status(400).json({ message: "Missing uid or newPassword" });
    }

    // 5. log ก่อน update รหัสผ่าน
    console.log("Updating password for uid:", uid);

    await admin.auth().updateUser(uid, { password: newPassword });

    // 6. log ก่อน update firestore
    if (firestoreData && typeof firestoreData === "object") {
      console.log("Updating Firestore LIMUsers doc:", uid, firestoreData);
      await admin.firestore().collection("LIMUsers").doc(uid).update(firestoreData);
    }

    // 7. log สำเร็จ
    console.log("Update success for", uid);
    return res.status(200).json({ message: "Password and user info updated." });

  } catch (err: any) {
    // 8. log error
    console.error("updateUserPasswordByAdmin error:", err);
    return res.status(500).json({
      message: err.message || "Failed to update user",
      error: err,
    });
  }
});


// 5. กัน method อื่นๆ ที่ไม่ใช่ POST/OPTIONS
app.all("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.status(405).json({ message: "Method Not Allowed" });
});

// 6. export function สำหรับ Cloud Functions
export const updateUserPasswordByAdmin = functions.https.onRequest(app);
