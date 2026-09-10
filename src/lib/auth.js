import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { STARTING_GEMS } from '../data/characters'

// Firebase Auth รู้จักแต่อีเมล เราเลยแปลงชื่อผู้ใช้เป็นอีเมลหลอกที่ไม่มีอยู่จริง
// ผู้เล่นไม่ต้องมีอีเมลและไม่เคยเห็นสตริงนี้
const DOMAIN = '@fantasy-emperor-war.local'

export const USERNAME_RULE = /^[a-z0-9_]{3,16}$/

export function toEmail(username) {
  return username.trim().toLowerCase() + DOMAIN
}

export function validateUsername(username) {
  const u = username.trim().toLowerCase()
  if (!u) return 'ยังไม่ได้กรอกชื่อผู้ใช้'
  if (u.length < 3) return 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร'
  if (u.length > 16) return 'ชื่อผู้ใช้ยาวได้ไม่เกิน 16 ตัวอักษร'
  if (!USERNAME_RULE.test(u)) return 'ใช้ได้เฉพาะ a-z, 0-9 และขีดล่าง ไม่รองรับภาษาไทยและเว้นวรรค'
  return null
}

export function validatePassword(password) {
  if (!password) return 'ยังไม่ได้กรอกรหัสผ่าน'
  if (password.length < 6) return 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร'
  return null
}

export async function signUp(username, password) {
  const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password)

  // สร้างเอกสารผู้เล่นทันที ค่าทุกตัวต้องตรงกับที่ Security Rules กำหนดไว้
  // ไม่งั้นจะโดนปฏิเสธ ซึ่งเป็นสิ่งที่ตั้งใจ — กันคนแก้โค้ดให้ตัวเองเริ่มด้วยเพชรหมื่นเม็ด
  await setDoc(doc(db, 'users', cred.user.uid), {
    username: username.trim().toLowerCase(),
    gems: STARTING_GEMS,
    starterChosen: false,
    team: [],
    pvpPoints: 0,
    createdAt: serverTimestamp(),
  })

  return cred.user
}

export async function signIn(username, password) {
  const cred = await signInWithEmailAndPassword(auth, toEmail(username), password)
  return cred.user
}

export function signOut() {
  return fbSignOut(auth)
}

export async function loadPlayer(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

const MESSAGES = {
  'auth/email-already-in-use': 'ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่นดู',
  'auth/invalid-credential': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  'auth/user-not-found': 'ไม่พบชื่อผู้ใช้นี้ ถ้ายังไม่เคยสมัครให้กดสมัครสมาชิก',
  'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
  'auth/weak-password': 'รหัสผ่านสั้นเกินไป ต้องยาวอย่างน้อย 6 ตัวอักษร',
  'auth/too-many-requests': 'ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่',
  'auth/network-request-failed': 'ต่ออินเทอร์เน็ตไม่ได้ ลองเช็กสัญญาณแล้วลองใหม่',
  'auth/operation-not-allowed': 'ยังไม่ได้เปิด Email/Password ในหน้า Authentication ของ Firebase',
  'permission-denied': 'Security Rules ปฏิเสธคำขอ ตรวจว่าอัปโหลดกฎเวอร์ชันล่าสุดแล้วหรือยัง',
}

export function explainError(err) {
  return MESSAGES[err?.code] ?? `เกิดข้อผิดพลาดที่ไม่รู้จัก (${err?.code || 'ไม่มีรหัส'})`
}
