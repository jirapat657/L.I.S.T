import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// เริ่มต้น Firebase Admin SDK
admin.initializeApp();

// Cloud Function สำหรับการอัปเดตข้อมูลผู้ใช้โดย Admin
export const updateUserPasswordByAdmin = functions.https.onRequest(async (req, res) => {
  // ตรวจสอบว่า method เป็น POST หรือไม่
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // ตรวจสอบ Token ว่าผู้ใช้มีสิทธิ์เป็น Admin หรือไม่
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken); // ตรวจสอบ idToken

    // ตรวจสอบว่า user ที่เข้ามามี `role = Admin` หรือไม่ใน Firestore
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'Admin') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // รับข้อมูลจาก request body
    const { uid, newPassword, firestoreData } = req.body;

    if (!uid || !newPassword) {
      res.status(400).json({ error: 'Missing uid or newPassword' });
      return;
    }

    // อัปเดตข้อมูลใน Firebase Authentication
    await admin.auth().updateUser(uid, { password: newPassword });

    // อัปเดตข้อมูลใน Firestore
    if (firestoreData) {
      await admin.firestore().collection('users').doc(uid).update(firestoreData);
    }

    // ส่งการตอบกลับโดยไม่มีค่าผลลัพธ์
    res.status(200).json({ message: 'User password and firestore data updated successfully' });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});
