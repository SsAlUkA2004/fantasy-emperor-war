// ค่าตั้งต้นของโปรเจกต์ Firebase — ไฟล์นี้ไม่ได้เก็บความลับใด ๆ
// (ค่าพวกนี้ติดไปกับไฟล์ JS ที่ผู้เล่นโหลดอยู่แล้ว ตัวที่กันคนอื่นแก้ข้อมูลคือ Security Rules)
// แต่เป็นค่าเฉพาะของแต่ละโปรเจกต์ Firebase จึงไม่ผูกไว้ตายตัวในซอร์ส
//
// วิธีตั้งค่า: Firebase Console → Project settings → Your apps → ก้อน firebaseConfig
// คัดลอกค่ามาแทนที่ค่าว่างด้านล่างนี้ ดูขั้นตอนเต็มได้ใน README.md

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

/** ยังไม่ได้ตั้งค่าโปรเจกต์จริง ก็ให้ทั้งแอปรู้ตัวและแสดงสถานะที่ถูกต้อง แทนที่จะพังตอนเริ่มแอป */
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
