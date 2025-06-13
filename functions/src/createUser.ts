import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { FieldValue } from "firebase-admin/firestore";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.options("/", cors({ origin: true }));

app.post("/", async (req, res) => {
  console.log("req.body = ", req.body);
  const {
    email, password, userName, jobPosition, role, status, userId
  } = req.body;

  if (!email || !password || !userName || !jobPosition || !role || !status || !userId) {
    console.log("[400] Missing required fields", req.body);
    return res.status(400).json({ message: "Missing required fields" });
  }

  // (Optional: ห้าม client สร้าง admin โดยตรง)
  // if (role === "Admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const user = await admin.auth().createUser({
      email, password, displayName: userName,
    });

    await admin.firestore().collection("LIMUsers").doc(user.uid).set({
      email, userName, jobPosition, role, status, userId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ uid: user.uid });
  } catch (err: any) {
    if (err.code === "auth/email-already-exists") {
      console.log("[400] Email already exists", email);
      return res.status(400).json({ message: "Email already in use" });
    }
    console.log("[500] createUser error", err);
    return res.status(500).json({ message: err.message || "Failed to create user", error: err });
  }
});

// กัน method อื่นที่ไม่ใช่ POST
app.all("*", (_, res) => {
  res.status(405).json({ message: "Method Not Allowed" });
});

export const createUser = functions.https.onRequest(app);
