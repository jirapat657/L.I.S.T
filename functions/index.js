//functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });  // เปิด CORS สำหรับทุกโดเมน
const { Timestamp } = require('firebase-admin/firestore');

admin.initializeApp();


// Utility function for handling Firebase operations
const handleFirestoreOperation = async (operation, docRef, data) => {
  try {
    await operation(docRef, data);
    return { status: 'success' };
  } catch (error) {
    console.error('Firestore operation failed:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
};

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




// ฟังก์ชันสำหรับอัปเดตรหัสผ่านผู้ใช้
exports.updateUserPasswordByAdmin = functions.https.onCall(async (data, context) => {
  // Auth check, role check ให้เหมือน getUsers
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Please log in.");

  // ตรวจสอบสิทธิ์ admin เหมือนเดิม...

  const { uid, newPassword } = data;
  if (!uid || !newPassword) throw new functions.https.HttpsError("invalid-argument", "Missing fields.");

  await admin.auth().updateUser(uid, { password: newPassword });
  return { success: true };
});


// ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
exports.updateUser = functions.https.onRequest(async (req, res) => {
  const { id, values } = req.body;

  try {
    const userRef = admin.firestore().collection('LIMUsers').doc(id);
    await handleFirestoreOperation(userRef.update, userRef, values);

    res.status(200).send('User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Failed to update user');
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



// ฟังก์ชันสำหรับลบผู้ใช้
exports.deleteUser = functions.https.onRequest(async (req, res) => {
  const { id } = req.body;

  try {
    const userRef = admin.firestore().collection('LIMUsers').doc(id);
    await handleFirestoreOperation(userRef.delete, userRef);

    await admin.auth().deleteUser(id);

    res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Failed to delete user');
  }
});

// ใช้ onCall แทน onRequest เพื่อให้ทำงานกับ Firebase Client SDK ได้สะดวก
exports.getUsers = functions.https.onCall(async (data, context) => {
    console.log("getUsers CALLED", { data, uid: context.auth?.uid });
    console.log("==== NEW CALL ====");
    console.log("context.auth:", context.auth);
    console.log("data:", data);

  // 1. Auth check
  const callerUid =
    context.auth?.uid ||
    context.auth?.token?.uid ||
    context.auth?.token?.user_id ||
    context.auth?.token?.sub;

    console.log("context.auth:", context.auth);
console.log("context.auth.uid:", context.auth?.uid);
console.log("context.auth.token:", context.auth?.token);
console.log("token.uid:", context.auth?.token?.uid);
console.log("token.user_id:", context.auth?.token?.user_id);
console.log("token.sub:", context.auth?.token?.sub);
console.log("context:", context);

  console.log("Caller UID:", callerUid);
  if (!callerUid) {
    console.log("No caller UID, user not authenticated");
    throw new functions.https.HttpsError("unauthenticated", "Please log in.");
  }

  // 2. Check admin role
  const adminDoc = await admin.firestore().collection("LIMUsers").doc(callerUid).get();
  if (!adminDoc.exists || adminDoc.data().role !== "Admin") {
    console.log("Not admin or profile not found for uid:", callerUid);
    throw new functions.https.HttpsError("permission-denied", "You are not admin.");
  }

  // 3. List all Auth users
  let allAuthUsers = [];
  let nextPageToken;
  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    console.log("Fetched Auth users batch, count:", listUsersResult.users.length);
    allAuthUsers = allAuthUsers.concat(listUsersResult.users);
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log("Total Auth users:", allAuthUsers.length);

  // 4. Get Firestore LIMUsers profiles
  const limUsersSnap = await admin.firestore().collection("LIMUsers").get();
  console.log("Total Firestore LIMUsers:", limUsersSnap.size);

  const limUsersMap = {};
  limUsersSnap.forEach(doc => {
    limUsersMap[doc.id] = doc.data();
  });

  // 5. Join both sides
  const users = allAuthUsers.map(userRecord => {
    const profile = limUsersMap[userRecord.uid] || {};
    const joinedUser = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      ...profile, // ข้อมูล profile จาก Firestore
    };
    console.log("Joined user:", joinedUser);
    return joinedUser;
  });

  // 6. Log and return
  console.log("Final joined users array (first 3 for preview):", users.slice(0, 3));
  console.log("Auth users:", allAuthUsers.map(u => u.uid));
console.log("LIMUsers:", Object.keys(limUsersMap));
console.log("users join:", users.length, users.slice(0,3));

  return users;
});