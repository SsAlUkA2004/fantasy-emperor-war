// ─────────────────────────────────────────────────────────────
// วางค่าจาก Firebase Console ตรงนี้
// Project settings → General → Your apps → SDK setup and configuration
//
// ค่าพวกนี้ไม่ใช่ความลับ เว็บทุกเจ้าที่ใช้ Firebase ก็เปิดดูได้จาก DevTools
// สิ่งที่กันคนอื่นเข้ามายุ่งกับข้อมูลคือ Firestore Security Rules ไม่ใช่การซ่อนค่าพวกนี้
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: 'AIzaSyDeqNBN82-gl3s0YxsjIBFul9cdyX-ZQM4',
  authDomain: 'fantasy-emperor-war.firebaseapp.com',
  projectId: 'fantasy-emperor-war',
  storageBucket: 'fantasy-emperor-war.firebasestorage.app',
  messagingSenderId: '1075381070019',
  appId: '1:1075381070019:web:0cc7bca02e4b9802231a76',
}

export const isConfigured = !Object.values(firebaseConfig).some(
  (v) => !v || v === 'ใส่ค่าตรงนี้'
)
