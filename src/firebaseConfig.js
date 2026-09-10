// ─────────────────────────────────────────────────────────────
// วางค่าจาก Firebase Console ตรงนี้
// Project settings → General → Your apps → SDK setup and configuration
//
// ค่าพวกนี้ไม่ใช่ความลับ เว็บทุกเจ้าที่ใช้ Firebase ก็เปิดดูได้จาก DevTools
// สิ่งที่กันคนอื่นเข้ามายุ่งกับข้อมูลคือ Firestore Security Rules ไม่ใช่การซ่อนค่าพวกนี้
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: 'ใส่ค่าตรงนี้',
  authDomain: 'ใส่ค่าตรงนี้',
  projectId: 'ใส่ค่าตรงนี้',
  storageBucket: 'ใส่ค่าตรงนี้',
  messagingSenderId: 'ใส่ค่าตรงนี้',
  appId: 'ใส่ค่าตรงนี้',
}

export const isConfigured = !Object.values(firebaseConfig).some(
  (v) => !v || v === 'ใส่ค่าตรงนี้'
)
