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

// ─────────────────────────────────────────────────────────────
// ระบบเพื่อนแบบต้องตอบรับ
//
// เพิ่มเพื่อนไม่ได้เป็นฝ่ายเดียวอีกแล้ว ต้องมีคนส่งคำขอและอีกฝั่งกดรับก่อน
// ถึงจะเป็นเพื่อนกันทั้งสองฝั่ง แต่ละคนเขียนได้แค่เอกสารของตัวเอง (กฎไม่เปิดให้เขียนข้ามผู้ใช้)
// จึงทำเป็นขั้นตอนที่แต่ละฝั่งเขียนของตัวเอง โดยกฎเป็นตัวบังคับลำดับ
//
//   1. ผู้ส่ง  เขียนคำขอลงกล่องของผู้รับ  users/{ผู้รับ}/friendRequests/{ผู้ส่ง}
//              และจดไว้ที่ตัวเอง            users/{ผู้ส่ง}/sentRequests/{ผู้รับ}
//   2. ผู้รับ  กดรับ → เขียน users/{ผู้รับ}/friends/{ผู้ส่ง} (กฎอนุญาตเพราะมีคำขออยู่) แล้วลบคำขอ
//   3. ผู้ส่ง  ตอนเปิดแอปครั้งถัดไป syncFriendships เห็นว่าผู้รับมีตนอยู่ในรายชื่อแล้ว
//              จึงเขียน users/{ผู้ส่ง}/friends/{ผู้รับ} (กฎอนุญาตเพราะอีกฝั่งมีตนอยู่แล้ว)
//
// จึงมีช่วงสั้น ๆ ที่ผู้รับเห็นผู้ส่งเป็นเพื่อนแล้วแต่ผู้ส่งยังไม่เห็น จนกว่าผู้ส่งจะเปิดแอป
// เลิกเป็นเพื่อนก็ทำฝั่งเดียวเช่นกัน อีกฝั่งจะถูกตัดออกให้เองตอน sync ครั้งถัดไป
// ─────────────────────────────────────────────────────────────

/** สถานะของผู้เล่นคนหนึ่งเทียบกับเรา: 'self' | 'friend' | 'sent' | 'incoming' | 'none' */
export function friendStatusOf(myUid, uid, status) {
  if (uid === myUid) return 'self'
  if (status.friends.has(uid)) return 'friend'
  if (status.incoming.has(uid)) return 'incoming'
  if (status.sent.has(uid)) return 'sent'
  return 'none'
}

const profileOf = (u) => ({ username: u.username, nickname: u.nickname ?? null })

/**
 * ส่งคำขอเป็นเพื่อน
 *
 * ถ้าอีกฝั่งส่งคำขอมาหาเราอยู่แล้ว ถือว่าต้องการตรงกัน รับให้เลยแทนการส่งซ้อน
 * คืน 'accepted' ในกรณีนั้น ไม่งั้นคืน 'sent'
 */
export async function sendFriendRequest(me, target) {
  if (me.uid === target.uid) throw new Error('เพิ่มตัวเองเป็นเพื่อนไม่ได้')

  const [already, incoming, sent] = await Promise.all([
    getDoc(doc(db, 'users', me.uid, 'friends', target.uid)),
    getDoc(doc(db, 'users', me.uid, 'friendRequests', target.uid)),
    getDoc(doc(db, 'users', me.uid, 'sentRequests', target.uid)),
  ])
  if (already.exists()) throw new Error('เป็นเพื่อนกันอยู่แล้ว')
  if (incoming.exists()) {
    await acceptRequest(me.uid, { uid: target.uid, ...profileOf(target) })
    return 'accepted'
  }
  if (sent.exists()) throw new Error('ส่งคำขอไปแล้ว รออีกฝั่งตอบรับ')

  await setDoc(doc(db, 'users', target.uid, 'friendRequests', me.uid), {
    ...profileOf(me),
    fromUid: me.uid,
    sentAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'users', me.uid, 'sentRequests', target.uid), {
    ...profileOf(target),
    sentAt: serverTimestamp(),
  })
  return 'sent'
}

/** คำขอที่คนอื่นส่งมาหาเรา */
export async function loadIncomingRequests(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'friendRequests'))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

/** คำขอที่เราส่งไปและยังไม่มีคำตอบ */
export async function loadSentRequests(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'sentRequests'))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

/** กดรับคำขอ เขียนเพื่อนฝั่งเราก่อน (กฎต้องเห็นคำขอยังอยู่) แล้วค่อยลบคำขอ */
export async function acceptRequest(uid, req) {
  await setDoc(doc(db, 'users', uid, 'friends', req.uid), {
    ...profileOf(req),
    mutual: true,
    addedAt: serverTimestamp(),
  })
  await deleteDoc(doc(db, 'users', uid, 'friendRequests', req.uid))
}

export async function rejectRequest(uid, fromUid) {
  await deleteDoc(doc(db, 'users', uid, 'friendRequests', fromUid))
}

/** ยกเลิกคำขอที่เราส่งไป */
export async function cancelRequest(uid, targetUid) {
  await deleteDoc(doc(db, 'users', targetUid, 'friendRequests', uid))
  await deleteDoc(doc(db, 'users', uid, 'sentRequests', targetUid))
}

/**
 * เก็บงานที่ค้างอยู่ให้ครบ เรียกทุกครั้งก่อนอ่านรายชื่อเพื่อน
 *
 * 1. คำขอที่เราส่งไป: ถ้าอีกฝั่งรับแล้ว (มีเราอยู่ในรายชื่อของเขา) เขียนฝั่งเราให้ครบ
 *    ถ้าคำขอหายไปโดยที่ไม่ได้รับ แปลว่าถูกปฏิเสธ ลบรายการที่จดไว้
 * 2. เพื่อนแบบตอบรับแล้ว (mutual) ที่อีกฝั่งลบเราออกไปแล้ว ตัดออกจากรายชื่อเราด้วย
 *    เพื่อนเก่าที่เพิ่มมาก่อนมีระบบนี้ (ไม่มี mutual) ไม่แตะ ไม่งั้นจะหายเงียบ ๆ ทั้งหมด
 *
 * ผลลัพธ์แจ้งได้ว่าใครรับ ใครปฏิเสธ ใครลบเรา ทุกขั้นที่พลาดข้ามไปเงียบ ๆ ไม่ให้หน้าที่เรียกพัง
 */
const SYNC_TTL_MS = 30000
const lastSync = new Map()

export async function syncFriendships(uid, { force = false } = {}) {
  const result = { accepted: [], declined: [], removed: [] }
  const last = lastSync.get(uid) ?? 0
  if (!force && Date.now() - last < SYNC_TTL_MS) return result
  lastSync.set(uid, Date.now())

  try {
    const sent = await getDocs(collection(db, 'users', uid, 'sentRequests'))
    for (const d of sent.docs) {
      const targetUid = d.id
      try {
        const theirs = await getDoc(doc(db, 'users', targetUid, 'friends', uid))
        if (theirs.exists()) {
          await setDoc(doc(db, 'users', uid, 'friends', targetUid), {
            username: d.data().username,
            nickname: d.data().nickname ?? null,
            mutual: true,
            addedAt: serverTimestamp(),
          })
          await deleteDoc(d.ref)
          result.accepted.push({ uid: targetUid, ...d.data() })
          continue
        }
        const pending = await getDoc(doc(db, 'users', targetUid, 'friendRequests', uid))
        if (!pending.exists()) {
          await deleteDoc(d.ref)
          result.declined.push({ uid: targetUid, ...d.data() })
        }
      } catch {
        // คำขอนี้พลาด ปล่อยไว้ลองใหม่รอบหน้า
      }
    }

    const mine = await getDocs(collection(db, 'users', uid, 'friends'))
    for (const d of mine.docs) {
      if (d.data().mutual !== true) continue
      try {
        const theirs = await getDoc(doc(db, 'users', d.id, 'friends', uid))
        if (!theirs.exists()) {
          await deleteDoc(d.ref)
          result.removed.push({ uid: d.id, ...d.data() })
        }
      } catch {
        // อ่านฝั่งเขาไม่ได้ ไม่ตัดออก
      }
    }
  } catch {
    // อ่านรายการของเราไม่ได้ ข้ามไปก่อน
  }
  return result
}

/** สถานะเพื่อนทั้งหมดของเรา ให้บอร์ดเลือกว่าจะโชว์ป้ายหรือปุ่มอะไรกับแต่ละคน */
export async function loadFriendStatus(uid) {
  await syncFriendships(uid)
  const [friends, sent, incoming] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'friends')),
    getDocs(collection(db, 'users', uid, 'sentRequests')),
    getDocs(collection(db, 'users', uid, 'friendRequests')),
  ])
  const ids = (snap) => new Set(snap.docs.map((d) => d.id))
  return { friends: ids(friends), sent: ids(sent), incoming: ids(incoming) }
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
  await syncFriendships(uid)
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
