// seed.js
const admin = require("firebase-admin");

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";

admin.initializeApp({
  // ถ้าใช้ Emulator จะดึง config จาก GOOGLE_APPLICATION_CREDENTIALS หรือ env อัตโนมัติ
  // ถ้าแค่ทดสอบ local emulator, แค่นี้พอ
  projectId: "lucas-strategy-company-dev", // หรือใช้ process.env.VITE_FIREBASE_PROJECT_ID
});

async function main() {
  try {
    const user = await admin.auth().createUser({
      email: "adminj@demo.com",
      password: "11223344",
      displayName: "Admin",
    });
    // สร้าง Firestore profile ด้วย
    await admin.firestore().collection("LIMUsers").doc(user.uid).set({
        email: "adminj@demo.com",
        userName: "adminJ",
        jobPosition: "Developer",
        role: "Admin",
        status: "Active",
        userId: "LC-000000",
    });
    console.log("✅ Seeded admin:", user.uid);
    process.exit(0);
  } catch (e) {
    console.error("❌ Seeding failed", e);
    process.exit(1);
  }
}
main();
