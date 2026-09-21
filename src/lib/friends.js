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
 * ค้นหาผู้เล่นจากชื่อผู้ใช้ ถ้าไม่เจอค่อยลองหาจากชื่อเล่น
 *
 * ชื่อผู้ใช้ไม่ซ้ำกันโดยปริยาย เพราะระบบสมัครแปลงชื่อเป็นอีเมลหลอก
 * แล้ว Firebase Auth บังคับให้อีเมลไม่ซ้ำอยู่แล้ว จึงไม่ต้องมีตารางจองชื่อแยก
 *
 * ต้องหาจากชื่อเล่นได้ด้วย เพราะตั้งแต่มีชื่อเล่น คนอื่นจะไม่เห็นชื่อผู้ใช้ของเราอีกแล้ว
 * (ดู lib/displayname.js) ถ้าค้นได้แต่ชื่อผู้ใช้ ก็จะไม่มีใครหาเราเจอจากสิ่งที่เขาเห็นบนบอร์ดเลย
 *
 * ชื่อเล่นซ้ำกันได้ จึงคืนคนแรกที่เจอ และไม่แปลงเป็นตัวพิมพ์เล็กเหมือนชื่อผู้ใช้
 * เพราะชื่อเล่นเก็บตามที่พิมพ์จริง
 */
export async function findPlayer(username) {
  const raw = username.trim()
  if (!raw) return null

  const byName = await getDocs(
    query(collection(db, 'users'), where('username', '==', raw.toLowerCase()), limit(1))
  )
  if (!byName.empty) {
    const d = byName.docs[0]
    return { uid: d.id, ...d.data() }
  }

  const byNick = await getDocs(
    query(collection(db, 'users'), where('nickname', '==', raw), limit(1))
  )
  if (byNick.empty) return null

  const d = byNick.docs[0]
  return { uid: d.id, ...d.data() }
}

export async function addFriend(uid, friend) {
  if (uid === friend.uid) throw new Error('เพิ่มตัวเองเป็นเพื่อนไม่ได้')

  await setDoc(doc(db, 'users', uid, 'friends', friend.uid), {
    username: friend.username,
    nickname: friend.nickname ?? null,
    addedAt: serverTimestamp(),
  })
}

/** รหัสเพื่อนทั้งหมดของเรา ไว้เช็คว่าใครเป็นเพื่อนแล้วบ้าง (บอร์ดใช้เลือกว่าจะโชว์ปุ่มเพิ่มหรือป้าย "เพื่อน") */
export async function loadFriendIds(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'friends'))
  return new Set(snap.docs.map((d) => d.id))
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
        : {
            uid: d.id,
            username: d.data().username ?? 'ไม่พบข้อมูล',
            nickname: d.data().nickname ?? null,
            missing: true,
          }
    })
  )

  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
}
