import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// เริ่มต้น Firebase Admin SDK
admin.initializeApp();

// CORS สำหรับ development (ปรับ origin ตามความเหมาะสม)
const cors = require("cors")({ origin: true });

// Cloud Function สำหรับ Super Admin อัพเดตข้อมูล user ใน Auth และ Firestore
export const updateUserBySuperAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      // ==== [NEW] ตรวจสอบ token ก่อน ====
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(idToken);

      // สมมติ role อยู่ใน Firestore collection 'LIMUsers'
      const userDoc = await admin.firestore().collection("LIMUsers").doc(decoded.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== "Admin") {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      // ==== [จบ] ตรวจสอบ token + role ====

      const { uid, email, displayName, password, firestoreData } = req.body;

      if (!uid) {
        res.status(400).json({ error: "Missing uid" });
        return;
      }

      const updateFields: admin.auth.UpdateRequest = {};
      if (email) updateFields.email = email;
      if (displayName) updateFields.displayName = displayName;
      if (password) updateFields.password = password;

      if (Object.keys(updateFields).length > 0) {
        await admin.auth().updateUser(uid, updateFields);
      }

      if (firestoreData) {
        await admin.firestore().collection("LIMUsers").doc(uid).update(firestoreData);
      }

      res.status(200).json({ message: "User updated successfully" });
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });
});

