//functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

admin.initializeApp();

// ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่
exports.createUser = functions.https.onRequest(async (req, res) => {
  console.log('REQ BODY:', JSON.stringify(req.body, null, 2));
  const payload = req.body.data || req.body;
  try {
    const { email, password, userName, role, jobPosition, userId, status } = payload;
    if (!email || !password || !userName) {
      return res.status(400).send({ message: 'Missing required fields', reqBody: payload });
    }

    // สร้าง user ใน Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: userName,
    });

    // เก็บ Firestore
    await admin.firestore().collection('LIMUsers').doc(userRecord.uid).set({
      email,
      userName,
      role,
      jobPosition,
      userId,
      status,
      createdAt: Timestamp.now(),
    });

    res.status(200).send({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    console.error('[ERROR] creating user:', error);
    res.status(500).send({ message: 'Failed to create user', error: error.message });
  }
});

// ฟังก์ชัน: อัปเดตข้อมูลโปรไฟล์ (userName, role, jobPosition, ...)แบบไม่protectอะไรเลย hardcode
exports.updateUserProfile = functions.https.onCall(async (data) => {
  const uid = data.uid  || data.data?.uid;
  const profileData = data.profileData || data.data?.profileData;
  console.log("uid:", uid);
  console.log("profileData:", profileData);

  if (!uid || !profileData) {
    throw new functions.https.HttpsError('invalid-argument', 'ต้องระบุ uid และ profileData');
  }

  try {
    await admin.firestore().collection('LIMUsers').doc(uid).update(profileData);
    return { success: true };
  } catch (err) {
    throw new functions.https.HttpsError('internal', 'Update failed');
  }
});

// ฟังก์ชัน: อัปเดตอีเมล (เฉพาะ admin เท่านั้น)
exports.updateUserEmail = functions.https.onCall(async (data) => {
  
  const uid = data.uid  || data.data?.uid;
  const newEmail = data.newEmail || data.data?.newEmail;
  console.log("uid:", uid);
    console.log("newEmail:", newEmail);
  if (!uid || !newEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'ข้อมูลไม่ครบ');
  }

  // 3. อัปเดตอีเมลใน Auth
  try {
    await admin.auth().updateUser(uid, { email: newEmail });
    // อัปเดต Firestore ให้ตรงกันด้วย (ถ้าเก็บอีเมลใน Firestore)
    await admin.firestore().collection('LIMUsers').doc(uid).update({ email: newEmail });
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message || 'Update email failed');
  }
});


// ฟังก์ชัน: อัปเดตรหัสผ่าน (เฉพาะ admin เท่านั้น)
exports.updateUserPassword = functions.https.onCall(async (data) => {
  
  const uid = data.uid  || data.data?.uid;
  const newPassword = data.newPassword || data.data?.newPassword;
  if (!uid || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'ข้อมูลไม่ครบ');
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message || 'Update password failed');
  }
});

// Cloud Function: อัปเดต displayName ใน Auth และ userName ใน Firestore
exports.updateUserDisplayName = functions.https.onCall(async (data) => {
  const uid = data.uid  || data.data?.uid;
  const newDisplayName = data.newDisplayName || data.data?.newDisplayName;
  if (!uid || !newDisplayName) {
    throw new functions.https.HttpsError('invalid-argument', 'ข้อมูลไม่ครบ');
  }

  try {
    // 1. อัปเดต displayName ใน Authentication
    await admin.auth().updateUser(uid, { displayName: newDisplayName });

    // 2. อัปเดต userName ใน Firestore (หากเก็บไว้)
    await admin.firestore().collection('LIMUsers').doc(uid).update({ userName: newDisplayName });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message || 'Update displayName failed');
  }
});

// ฟังก์ชันสำหรับลบผู้ใช้
exports.deleteUser = functions.https.onCall(async (data) => {
  // รับ id มาจาก client
  const uid = data.uid || data.data?.uid || data.id || data.data?.id;
  console.log("deleteUser called with uid:", uid);

  if (!uid) {
    console.error("No uid provided");
    throw new functions.https.HttpsError("invalid-argument", "Missing user uid");
  }

  try {
    // 1. ลบใน Firebase Authentication
    await admin.auth().deleteUser(uid);
    console.log("Deleted user from Auth:", uid);

    // 2. ลบใน Firestore
    await admin.firestore().collection("LIMUsers").doc(uid).delete();
    console.log("Deleted user doc from Firestore:", uid);

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("internal", error.message || "Delete failed");
  }
});

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จากอีเมล (ใช้ https.onCall)
exports.getUserByEmail = functions.https.onCall(async (data, context) => {
  const email =
    data?.email ||
    data?.data?.email ||
    "";

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }

  try {
    // 1. ดึงจาก Auth (เช่น uid)
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    // 2. ดึง profile จาก Firestore (เช่น collection 'users')
    const userDoc = await admin.firestore().collection('LIMUsers').doc(uid).get();

    let userProfile = null;
    if (userDoc.exists) {
      userProfile = userDoc.data();
      console.log("🔥 userProfile from Firestore:", userProfile);
    }else {
        console.log("⚠️ ไม่พบ userProfile ใน Firestore");
        }

    // 3. ส่งกลับ ข้อมูล auth + profile (รวมกัน)
    return {
      auth: userRecord.toJSON(),
      profile: userProfile, // จะ null ถ้าไม่เจอใน firestore
    };
  } catch (error) {
    throw new functions.https.HttpsError("not-found", "User not found");
  }
});

exports.updateUserStatus = functions.https.onCall(async (data) => {

  const uid = data.id  || data.data?.id;
  const status = data.status || data.data?.status;

  if (!uid || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing id or status');
  }
  await admin.firestore().collection('LIMUsers').doc(uid).update({ status });
  return { success: true };
});