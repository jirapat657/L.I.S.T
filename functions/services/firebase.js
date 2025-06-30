const admin = require('firebase-admin')
const { getStorage } = require('firebase-admin/storage')
const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG)
const { setGlobalOptions } = require('firebase-functions/v2')

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
})

const db = admin.firestore()
const authen = admin.auth()
const storages = getStorage().bucket(adminConfig.storageBucket)

setGlobalOptions({
  memory: '2GB',
  region: 'asia-southeast1',
})

module.exports = {
  db,
  authen,
  storages,
}
