import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { CREATE_COST, MAX_MEMBERS, validateName, validateTag } from '../data/guild'

const guildRef = (id) => doc(db, 'guilds', id)
const membersRef = (id) => collection(db, 'guilds', id, 'members')

function slug(tag) {
  return tag.trim().toUpperCase()
}

/**
 * สร้างกิลด์ใหม่
 *
 * ใช้ตัวย่อเป็นรหัสเอกสาร ตัวย่อจึงไม่ซ้ำกันโดยปริยาย
 * ไม่ต้องมีตารางจองชื่อแยก และคนที่สร้างพร้อมกันด้วยตัวย่อเดียวกันจะมีคนเดียวที่สำเร็จ
 */
export async function createGuild(player, name, tag) {
  const nameErr = validateName(name)
  if (nameErr) throw new Error(nameErr)
  const tagErr = validateTag(tag)
  if (tagErr) throw new Error(tagErr)
  if (player.guildId) throw new Error('ออกจากกิลด์เดิมก่อน')
  if ((player.gems ?? 0) < CREATE_COST) throw new Error(`ต้องใช้เพชร ${CREATE_COST} เม็ด`)

  const id = slug(tag)

  await runTransaction(db, async (tx) => {
    const exists = await tx.get(guildRef(id))
    if (exists.exists()) throw new Error('ตัวย่อนี้มีกิลด์ใช้แล้ว ลองตัวย่ออื่น')

    tx.set(guildRef(id), {
      name: name.trim(),
      tag: id,
      ownerUid: player.uid,
      ownerName: player.username,
      memberCount: 1,
      points: 0,
      notice: '',
      createdAt: serverTimestamp(),
    })
    tx.set(doc(membersRef(id), player.uid), {
      username: player.username,
      role: 'owner',
      contribution: 0,
      joinedAt: serverTimestamp(),
    })
    tx.update(doc(db, 'users', player.uid), {
      guildId: id,
      gems: player.gems - CREATE_COST,
    })
  })

  return id
}

/**
 * เข้าร่วมกิลด์
 *
 * ตัวนับสมาชิกอ่านและเขียนใน transaction เดียวกัน
 * สองคนกดเข้าพร้อมกันจึงถูกนับครบทั้งคู่ และกิลด์เต็มแล้วจะไม่มีใครแทรกเข้ามาได้
 */
export async function joinGuild(player, guildId) {
  if (player.guildId) throw new Error('ต้องออกจากกิลด์เดิมก่อน')

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(guildRef(guildId))
    if (!snap.exists()) throw new Error('ไม่พบกิลด์นี้')

    const g = snap.data()
    if ((g.memberCount ?? 0) >= MAX_MEMBERS) throw new Error('กิลด์เต็มแล้ว')

    tx.update(guildRef(guildId), { memberCount: (g.memberCount ?? 0) + 1 })
    tx.set(doc(membersRef(guildId), player.uid), {
      username: player.username,
      role: 'member',
      contribution: 0,
      joinedAt: serverTimestamp(),
    })
    tx.update(doc(db, 'users', player.uid), { guildId })
  })
}

export async function leaveGuild(player) {
  const guildId = player.guildId
  if (!guildId) throw new Error('ยังไม่ได้อยู่กิลด์ไหน')

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(guildRef(guildId))
    if (snap.exists()) {
      const g = snap.data()
      if (g.ownerUid === player.uid && (g.memberCount ?? 1) > 1) {
        throw new Error('หัวหน้าต้องโอนตำแหน่งหรือให้สมาชิกออกหมดก่อน')
      }
      tx.update(guildRef(guildId), { memberCount: Math.max(0, (g.memberCount ?? 1) - 1) })
    }
    tx.delete(doc(membersRef(guildId), player.uid))
    tx.update(doc(db, 'users', player.uid), { guildId: null })
  })
}

export async function kickMember(guildId, uid) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(guildRef(guildId))
    if (!snap.exists()) throw new Error('ไม่พบกิลด์นี้')
    tx.update(guildRef(guildId), {
      memberCount: Math.max(0, (snap.data().memberCount ?? 1) - 1),
    })
    tx.delete(doc(membersRef(guildId), uid))
    tx.update(doc(db, 'users', uid), { guildId: null })
  })
}

export async function setRole(guildId, uid, role) {
  await updateDoc(doc(membersRef(guildId), uid), { role })
}

export async function setNotice(guildId, notice) {
  await updateDoc(guildRef(guildId), { notice: notice.slice(0, 200) })
}

export async function loadGuild(guildId) {
  const snap = await getDoc(guildRef(guildId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * จดค่าพลังของตัวเองไว้ในเอกสารสมาชิก
 *
 * ต้องเก็บไว้ตรงนี้ เพราะกระเป๋าตัวละครของแต่ละคนอยู่ในคอลเลกชันย่อยที่คนอื่นอ่านไม่ได้
 * ถ้าไม่จดไว้ กิลด์จะรวมพลังสมาชิกไม่ได้เลย
 * ค่าจะอัปเดตทุกครั้งที่เจ้าตัวเปิดหน้ากิลด์ จึงเป็นค่าล่าสุดเท่าที่เขาเข้ามาดู
 */
export async function reportPower(guildId, uid, power) {
  await updateDoc(doc(membersRef(guildId), uid), { power: Math.round(power) })
}

export function guildPower(members = []) {
  return members.reduce((sum, m) => sum + (m.power ?? 0), 0)
}

export async function loadMembers(guildId) {
  const snap = await getDocs(query(membersRef(guildId), orderBy('contribution', 'desc')))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

/** รายชื่อกิลด์ที่ยังไม่เต็ม เรียงตามคะแนน */
export async function browseGuilds(count = 20) {
  const snap = await getDocs(query(collection(db, 'guilds'), orderBy('points', 'desc'), limit(count)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function findGuildByTag(tag) {
  const snap = await getDoc(guildRef(slug(tag)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
