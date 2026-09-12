// ─────────────────────────────────────────────────────────────
// แรงค์ 8 ขั้น ดิวิชันละ 120 แต้มสำหรับขั้นที่ 1 ถึง 6
//
// ยิ่งแรงค์สูง ชนะได้แต้มน้อยลงและแพ้เสียมากขึ้น
// เพื่อไม่ให้คนที่ขึ้นไปแล้วลอยอยู่ข้างบนโดยไม่ต้องรักษาฟอร์ม
//
// แต่ละขั้นมีพื้นกันตก ร่วงต่ำกว่าพื้นของแรงค์ตัวเองไม่ได้
// ป้องกันอาการแพ้ติดกันแล้วร่วงยาวจนเลิกเล่น
// ─────────────────────────────────────────────────────────────

export const RANKS = [
  { index: 0, name: 'ผู้ฝึกหัด', mark: '🪶', min: 0, gain: 30, loss: 12 },
  { index: 1, name: 'นักผจญภัย', mark: '🗺️', min: 600, gain: 30, loss: 12 },
  { index: 2, name: 'อัศวิน', mark: '⚔️', min: 1200, gain: 30, loss: 12 },
  { index: 3, name: 'แชมเปี้ยน', mark: '🏆', min: 1800, gain: 25, loss: 18 },
  { index: 4, name: 'จอมทัพ', mark: '🔱', min: 2400, gain: 25, loss: 18 },
  { index: 5, name: 'ราชันย์', mark: '👑', min: 3000, gain: 20, loss: 22 },
  { index: 6, name: 'กึ่งเทพ', mark: '✨', min: 3600, gain: 15, loss: 25 },
]

export const DIVISION_SIZE = 120
export const MATCHES_PER_DAY = 10

/** ฉายาปลดล็อกตามแรงค์สูงสุดที่เคยไปถึง */
export const TITLES = [
  { index: 0, name: 'ผู้มาใหม่', requires: 0 },
  { index: 1, name: 'นักเดินทาง', requires: 1 },
  { index: 2, name: 'ผู้ถือดาบ', requires: 2 },
  { index: 3, name: 'ผู้ชนะสิบทิศ', requires: 3 },
  { index: 4, name: 'ผู้นำทัพ', requires: 4 },
  { index: 5, name: 'เจ้าผู้ครองสนาม', requires: 5 },
  { index: 6, name: 'ผู้ก้าวข้ามมนุษย์', requires: 6 },
]

/**
 * รางวัลที่ได้ครั้งเดียวเมื่อไต่ถึงแรงค์นั้นเป็นครั้งแรก
 *
 * ผูกกับแรงค์สูงสุดที่เคยไปถึง ไม่ใช่แรงค์ปัจจุบัน
 * ตกลงมาแล้วรางวัลไม่ถูกยึดคืน และไต่ขึ้นไปใหม่ก็ไม่ได้ซ้ำ
 */
export const RANK_REWARDS = {
  1: { gems: 300, pool: {} },
  2: { gems: 600, pool: { SR: 20 } },
  3: { gems: 1000, pool: { SR: 40 } },
  4: { gems: 1500, pool: { SSR: 50 } },
  5: { gems: 2200, pool: { SSR: 100 } },
  6: { gems: 3000, pool: { SSR: 150 } },
}

export function rewardFor(rankIndex) {
  return RANK_REWARDS[rankIndex] ?? null
}

/** แรงค์ที่ไปถึงแล้วแต่ยังไม่ได้กดรับรางวัล */
export function claimableRanks(highestRank = 0, claimed = []) {
  return Object.keys(RANK_REWARDS)
    .map(Number)
    .filter((i) => i <= highestRank && !claimed.includes(i))
    .sort((a, b) => a - b)
}

export function rankOf(points = 0) {
  return [...RANKS].reverse().find((r) => points >= r.min) ?? RANKS[0]
}

/** ดิวิชัน 5 คือต่ำสุดของแรงค์นั้น ขั้นสูงสุดไม่มีดิวิชัน */
export function divisionOf(points = 0) {
  const rank = rankOf(points)
  if (rank.index >= RANKS.length - 1) return null
  const into = points - rank.min
  return Math.max(1, 5 - Math.floor(into / DIVISION_SIZE))
}

export function rankLabel(points = 0) {
  const rank = rankOf(points)
  const div = divisionOf(points)
  return div ? `${rank.name} ${div}` : rank.name
}

/**
 * แต้มที่ได้หรือเสีย ปรับตามระดับแรงค์ของคู่แข่ง
 * ชนะคนแรงค์สูงกว่าได้เพิ่ม แพ้คนแรงค์ต่ำกว่าเสียเพิ่ม อย่างละ 5 แต้มต่อขั้น
 */
export function pointDelta(myPoints, foePoints, won) {
  const me = rankOf(myPoints)
  const foe = rankOf(foePoints)
  const gap = foe.index - me.index

  if (won) return Math.max(5, me.gain + gap * 5)
  return -Math.max(5, me.loss - gap * 5)
}

/** ใช้พื้นกันตกของแรงค์ปัจจุบัน */
export function applyDelta(points, delta) {
  const floor = rankOf(points).min
  return Math.max(floor, points + delta)
}

export function titlesFor(highestRank = 0) {
  return TITLES.filter((t) => t.requires <= highestRank)
}

export function titleName(index = 0) {
  return TITLES[index]?.name ?? TITLES[0].name
}
