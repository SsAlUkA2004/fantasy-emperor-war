import { RANKS, rankOf } from './ranks'
import { makeBots } from './bots'

// ─────────────────────────────────────────────────────────────
// การจับคู่ประลอง
//
// รายการคู่แข่งมีหกช่องเสมอ สามช่องแรกเป็นผู้เล่นจริง ที่เหลือเป็นบอท
// ผู้เล่นจริงต้องอยู่แรงค์ห่างจากเราไม่เกินหนึ่งขั้น (ทั้งสูงและต่ำกว่า)
// ถ้ามีผู้เล่นที่เข้าเงื่อนไขไม่ถึงสามคน ช่องที่ขาดจะถูกเติมด้วยบอทแทน
// (ไม่มีผู้เล่นเลยก็เป็นบอทครบทั้งหกช่อง)
// ─────────────────────────────────────────────────────────────

export const OPPONENT_SLOTS = 6
export const MAX_PLAYER_OPPONENTS = 3
export const RANK_RANGE = 1

/** ช่วงแต้มที่ครอบแรงค์ของเราและแรงค์ข้างเคียง: [ต่ำสุด, สูงสุดที่ไม่รวม) สูงสุดเป็น Infinity ถ้าไม่มีแรงค์ถัดไป */
export function pointRange(points = 0) {
  const idx = rankOf(points).index
  const lo = RANKS[Math.max(0, idx - RANK_RANGE)].min
  const upper = RANKS[idx + RANK_RANGE + 1]
  return { lo, hi: upper ? upper.min : Infinity }
}

export function withinRankRange(myPoints, theirPoints) {
  return Math.abs(rankOf(myPoints).index - rankOf(theirPoints).index) <= RANK_RANGE
}

/**
 * ประกอบรายการคู่แข่งจากผู้เล่นจริงที่ดึงมา
 *
 * candidates คือเอกสารผู้ใช้ที่ดึงมาแล้ว ฟังก์ชันนี้กรองเองอีกชั้นว่าอยู่ในช่วงแรงค์ ตั้งทีมรับแล้ว
 * และไม่ใช่ตัวเรา ไม่ไว้ใจว่าคนเรียกกรองมาให้แล้ว
 */
export function assembleOpponents(me, candidates = [], random = Math.random) {
  const points = me?.pvpPoints ?? 0
  const eligible = candidates.filter(
    (u) =>
      u.uid !== me?.uid &&
      u.starterChosen &&
      Array.isArray(u.defense) &&
      u.defense.length &&
      withinRankRange(points, u.pvpPoints ?? 0)
  )

  const players = []
  const copy = [...eligible]
  while (players.length < MAX_PLAYER_OPPONENTS && copy.length) {
    players.push(copy.splice(Math.floor(random() * copy.length), 1)[0])
  }

  return [...players, ...makeBots(me, OPPONENT_SLOTS - players.length)]
}
