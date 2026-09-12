import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * ค้นหาผู้เล่นจากชื่อผู้ใช้
 *
 * ชื่อผู้ใช้ไม่ซ้ำกันโดยปริยาย เพราะระบบสมัครแปลงชื่อเป็นอีเมลหลอก
 * แล้ว Firebase Auth บังคับให้อีเมลไม่ซ้ำอยู่แล้ว จึงไม่ต้องมีตารางจองชื่อแยก
 */
export async function findPlayer(username) {
  const name = username.trim().toLowerCase()
  if (!name) return null

  const snap = await getDocs(
    query(collection(db, 'users'), where('username', '==', name), limit(1))
  )
  if (snap.empty) return null

  const d = snap.docs[0]
  return { uid: d.id, ...d.data() }
}

export async function addFriend(uid, friend) {
  if (uid === friend.uid) throw new Error('เพิ่มตัวเองเป็นเพื่อนไม่ได้')

  await setDoc(doc(db, 'users', uid, 'friends', friend.uid), {
    username: friend.username,
    addedAt: serverTimestamp(),
  })
}

export async function removeFriend(uid, friendUid) {
  await deleteDoc(doc(db, 'users', uid, 'friends', friendUid))
}

/**
 * อ่านรายชื่อเพื่อน แล้วดึงข้อมูลสดของแต่ละคนมาอีกที
 *
 * ไม่เก็บเลเวลหรือแรงค์ของเพื่อนไว้ในเอกสารของเรา เพราะข้อมูลจะเก่าทันที
 * ที่เพื่อนเล่นต่อ เก็บแค่รหัสไว้แล้วอ่านสดทุกครั้ง
 */
export async function loadFriends(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'friends'))

  // ใช้ allSettled ไม่ใช่ all
  // ถ้าอ่านข้อมูลเพื่อนคนหนึ่งไม่สำเร็จ รายชื่อทั้งหมดไม่ควรหายไปด้วย
  const results = await Promise.allSettled(
    snap.docs.map(async (d) => {
      const live = await getDoc(doc(db, 'users', d.id))
      return live.exists()
        ? { uid: d.id, ...live.data() }
        : { uid: d.id, username: d.data().username ?? 'ไม่พบข้อมูล', missing: true }
    })
  )

  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
}
