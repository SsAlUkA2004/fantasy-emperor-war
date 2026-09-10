import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore'
import { firebaseConfig, isConfigured } from './firebaseConfig'

let app = null
let auth = null
let db = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db, isConfigured }

/**
 * ยิงอ่าน Firestore หนึ่งครั้งเพื่อพิสูจน์ว่าเว็บคุยกับโปรเจกต์ได้จริง
 * permission-denied ถือว่า "ผ่าน" เพราะแปลว่าคำขอไปถึงเซิร์ฟเวอร์แล้ว
 * และ Security Rules ทำงานอยู่ ซึ่งเป็นสิ่งที่เราต้องการ
 */
export async function checkConnection() {
  if (!isConfigured) {
    return { state: 'unconfigured' }
  }

  try {
    const snap = await getDocs(query(collection(db, 'characters'), limit(1)))
    return { state: 'ok', empty: snap.empty }
  } catch (err) {
    if (err.code === 'permission-denied') {
      return { state: 'locked' }
    }
    return { state: 'error', code: err.code || 'unknown', message: err.message }
  }
}
