const admin = require("firebase-admin");

if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  // สำหรับ Emulator (local dev)

  // export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 ก่อน node setAdminClaim.cjs

  admin.initializeApp({
    projectId: "lucas-strategy-company-dev", // projectId ของคุณ
  });
  console.log("🟡 กำลังเชื่อมต่อ Firebase Emulator...");
} else {
  // สำหรับ Production (deploy จริง)
  const serviceAccount = require("./lucas-strategy-company-dev-firebase-adminsdk-r50it-df8e1aafa8.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com", // ไม่จำเป็นสำหรับแค่ auth
  });
  console.log("🟢 กำลังเชื่อมต่อ Firebase Production...");
}

// ----- ส่วนนี้ค่อยเรียกใช้บริการของ Firebase Admin SDK -----
const uid = "dVT53Mv6SOmQsXtjRp1f96D05nod";

admin.auth().setCustomUserClaims(uid, { role: "Admin" })
  .then(() => {
    console.log(`✅ Custom claim 'role: Admin' set for uid: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error setting custom claim:", error);
    process.exit(1);
  });
