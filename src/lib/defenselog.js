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
import { applyDelta, defenseDelta, rankOf } from '../data/ranks'

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

/**
 * ผู้โจมตีหย่อนใบบันทึกไว้ เรียกหลังจบทุกแมตช์กับผู้เล่นจริง ทั้งชนะและแพ้
 * ชนะ ผู้ตั้งรับเสียแต้ม แพ้ ผู้ตั้งรับได้แต้ม (ดู defenseDelta)
 * attacker.points คือแต้มของผู้โจมตีก่อนแมตช์ ใช้ตัดสินว่าชนะคนแรงค์สูงกว่าได้เพิ่มเท่าไหร่
 */
export async function logAttack(defenderUid, attacker, attackerWon) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  await setDoc(doc(box(defenderUid), id), {
    attacker: attacker.username,
    attackerUid: attacker.uid,
    attackerPoints: attacker.points ?? 0,
    attackerWon,
    at: serverTimestamp(),
  }).catch(() => null)
}

export async function loadLogs(uid, count = 10) {
  const snap = await getDocs(query(box(uid), limit(count)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * ปรับแต้มตัวเองตามใบบันทึกทีละใบ (ถูกชนะเสียแต้ม ป้องกันสำเร็จได้แต้ม)
 *
 * ทำทีละใบเพราะกฎจำกัดว่าแต้มขยับได้ไม่เกินหนึ่งแมตช์ต่อการเขียนหนึ่งครั้ง
 * ถ้ารวบหักทีเดียวหลายใบจะถูกปฏิเสธ
 */
export async function settleLogs(player) {
  const logs = await loadLogs(player.uid, 10).catch(() => [])
  if (!logs.length) return null

  let points = player.pvpPoints ?? 0
  let highest = player.highestRank ?? 0
  let seasonHighest = player.seasonHighest ?? 0
  let lost = 0
  let gained = 0
  let defended = 0
  let count = 0

  for (const log of logs) {
    const next = applyDelta(points, defenseDelta(points, log.attackerWon, log.attackerPoints))
    // ได้แต้มจนขึ้นแรงค์ใหม่ต้องนับเป็นแรงค์สูงสุดด้วย (ปลดล็อกฉายาและของที่ผูกกับแรงค์)
    highest = Math.max(highest, rankOf(next).index)
    seasonHighest = Math.max(seasonHighest, rankOf(next).index)

    await updateDoc(doc(db, 'users', player.uid), {
      pvpPoints: next,
      highestRank: highest,
      seasonHighest,
    })
    await deleteDoc(doc(box(player.uid), log.id))

    if (next < points) lost += points - next
    else gained += next - points
    if (!log.attackerWon) defended += 1
    points = next
    count += 1
  }

  return { count, lost, gained, defended, points }
}
