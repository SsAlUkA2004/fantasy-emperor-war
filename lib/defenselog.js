import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { applyDelta, pointDelta, rankOf } from '../data/ranks'

// ─────────────────────────────────────────────────────────────
// บันทึกการถูกโจมตี
//
// คนที่ถูกท้าควรเสียแต้มด้วย ไม่ใช่เสียฝ่ายเดียวตอนเป็นฝ่ายบุก
// แต่ผู้โจมตีเขียนเอกสารของคนที่ถูกโจมตีไม่ได้ กฎห้ามเขียนข้ามผู้ใช้
//
// จึงให้ผู้โจมตีหย่อนใบบันทึกไว้ในกล่องของอีกฝ่าย
// แล้วเจ้าของกล่องเป็นคนหักแต้มตัวเองตอนเปิดเกมครั้งถัดไป
// กฎยังคุมได้เหมือนเดิม เพราะแต้มยังขยับได้แค่ในช่วงที่หนึ่งแมตช์ทำได้
// ─────────────────────────────────────────────────────────────

const box = (uid) => collection(db, 'users', uid, 'defenseLog')

/** ผู้โจมตีหย่อนใบบันทึกไว้ เรียกหลังจบแมตช์ที่ฝ่ายบุกชนะ */
export async function logAttack(defenderUid, attacker, attackerWon) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  await setDoc(doc(box(defenderUid), id), {
    attacker: attacker.username,
    attackerUid: attacker.uid,
    attackerWon,
    at: serverTimestamp(),
  }).catch(() => null)
}

export async function loadLogs(uid, count = 10) {
  const snap = await getDocs(query(box(uid), limit(count)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * หักแต้มตัวเองตามใบบันทึกทีละใบ
 *
 * ทำทีละใบเพราะกฎจำกัดว่าแต้มขยับได้ไม่เกินหนึ่งแมตช์ต่อการเขียนหนึ่งครั้ง
 * ถ้ารวบหักทีเดียวหลายใบจะถูกปฏิเสธ
 */
export async function settleLogs(player) {
  const logs = await loadLogs(player.uid, 10).catch(() => [])
  if (!logs.length) return null

  let points = player.pvpPoints ?? 0
  let lost = 0
  let count = 0

  for (const log of logs) {
    // แพ้ตอนตั้งรับคือผู้โจมตีชนะ เสียแต้มตามระดับของตัวเอง
    const delta = log.attackerWon ? pointDelta(points, points, false) : 0
    const next = applyDelta(points, delta)

    await updateDoc(doc(db, 'users', player.uid), {
      pvpPoints: next,
      seasonHighest: Math.max(player.seasonHighest ?? 0, rankOf(next).index),
    })
    await deleteDoc(doc(box(player.uid), log.id))

    lost += points - next
    points = next
    count += 1
  }

  return { count, lost, points }
}
