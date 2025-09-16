// functions/index.js
const admin = require('firebase-admin')
const { setGlobalOptions } = require('firebase-functions/v2')
const { onCall, HttpsError } = require('firebase-functions/v2/https')

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()
const authen = admin.auth()
const { FieldValue } = require('firebase-admin/firestore')

// ✅ ตั้ง region global ครั้งเดียว
setGlobalOptions({ region: 'asia-southeast1' })

// ===== createUser (onCall) =====
exports.createUser = onCall(async (req) => {
  const data = req.data || {}

  // ใส่ค่า default กัน undefined ตั้งแต่ต้น
  const {
    email,
    password,
    userName,
    role = 'Staff',
    jobPosition = '',
    userId = '',
    status = 'Active',
  } = data

  if (!email || !password || !userName) {
    throw new HttpsError('invalid-argument', 'Missing required fields')
  }

  let uid = null

  try {
    // 1) สร้างใน Auth
    const userRecord = await authen.createUser({ email, password, displayName: userName })
    uid = userRecord.uid

    // 2) เตรียมเอกสารแบบ “ไม่มี undefined” และใช้ new Date() (กันปัญหา FieldValue)
    const rawDoc = {
      email,
      userName,
      role,
      jobPosition,
      userId,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const doc = Object.fromEntries(Object.entries(rawDoc).filter(([, v]) => v !== undefined))

    // log ให้เห็น payload ที่กำลังเขียน (ไม่ log password)
    console.log('[createUser] write doc', { uid, ...doc })

    // 3) เขียน Firestore
    await db.collection('LIMUsers').doc(uid).set(doc)

    console.log('[createUser] done', { uid })
    return { success: true, uid }
  } catch (error) {
    // ถ้า Auth สำเร็จแล้ว แต่ Firestore ล้ม → rollback ผู้ใช้ที่เพิ่งสร้าง
    if (uid) {
      try {
        await authen.deleteUser(uid)
        console.warn('[createUser] rollback: deleted auth user', { uid })
      } catch (e) {
        console.error('[createUser] rollback failed', { code: e?.code, message: e?.message })
      }
    }

    console.error('[createUser] error', { code: error?.code, message: error?.message, stack: error?.stack })

    // map error ที่พบบ่อยให้อ่านง่าย
    switch (error?.code) {
      case 'auth/email-already-exists':
        throw new HttpsError('already-exists', 'อีเมลนี้ถูกใช้งานแล้ว')
      case 'auth/invalid-password':
        throw new HttpsError('invalid-argument', 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร')
      case 'auth/invalid-email':
        throw new HttpsError('invalid-argument', 'รูปแบบอีเมลไม่ถูกต้อง')
      default:
        // ถ้าเป็นเคส Firestore ไม่ยอม (เช่น undefined ใน doc) message จะบอกชัด
        throw new HttpsError('internal', error?.message || 'Failed to create user')
    }
  }
})

// ===== updateUserProfile =====
exports.updateUserProfile = onCall(async (req) => {
  const { uid, profileData } = req.data || {}
  if (!uid || !profileData) {
    throw new HttpsError('invalid-argument', 'ต้องระบุ uid และ profileData')
  }
  await db.collection('LIMUsers').doc(uid).update({
    ...profileData,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { success: true }
})

// ===== updateUserEmail =====
exports.updateUserEmail = onCall(async (req) => {
  const { uid, newEmail } = req.data || {}
  if (!uid || !newEmail) {
    throw new HttpsError('invalid-argument', 'ข้อมูลไม่ครบ')
  }
  try {
    await authen.updateUser(uid, { email: newEmail })
    await db.collection('LIMUsers').doc(uid).update({
      email: newEmail,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    if (error?.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'อีเมลนี้ถูกใช้งานแล้ว')
    }
    throw new HttpsError('internal', error.message || 'Update email failed')
  }
})

// ===== updateUserPassword =====
exports.updateUserPassword = onCall(async (req) => {
  const { uid, newPassword } = req.data || {}
  if (!uid || !newPassword) {
    throw new HttpsError('invalid-argument', 'ข้อมูลไม่ครบ')
  }
  await authen.updateUser(uid, { password: newPassword })
  return { success: true }
})

// ===== updateUserDisplayName =====
exports.updateUserDisplayName = onCall(async (req) => {
  const { uid, newDisplayName } = req.data || {}
  if (!uid || !newDisplayName) {
    throw new HttpsError('invalid-argument', 'ข้อมูลไม่ครบ')
  }
  await authen.updateUser(uid, { displayName: newDisplayName })
  await db.collection('LIMUsers').doc(uid).update({
    userName: newDisplayName,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { success: true }
})

// ===== deleteUser =====
exports.deleteUser = onCall(async (req) => {
  const { uid, id } = req.data || {}
  const target = uid || id
  if (!target) {
    throw new HttpsError('invalid-argument', 'Missing user uid')
  }
  await authen.deleteUser(target)
  await db.collection('LIMUsers').doc(target).delete()
  return { success: true }
})

// ===== updateUserStatus =====
exports.updateUserStatus = onCall(async (req) => {
  const { uid, id, status } = req.data || {}
  const target = uid || id
  if (!target || !status || !['Active', 'Inactive'].includes(status)) {
    throw new HttpsError('invalid-argument', 'Missing or invalid id/status')
  }
  await db.collection('LIMUsers').doc(target).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { success: true }
})
