// ─────────────────────────────────────────────────────────────
// ฤดูกาลประลอง
//
// ยาว 60 วัน จบแล้วแจกรางวัลตามแรงค์สูงสุดของฤดูกาลนั้น แล้วรีเซ็ตแต้ม
//
// ไม่ได้ใช้ตัวตั้งเวลาบนเซิร์ฟเวอร์เหมือนบอสโลก
// ผู้เล่นคนไหนเปิดเกมหลังฤดูกาลจบ จะปิดฤดูกาลของตัวเองแล้วรับจดหมายรางวัล
// กฎตรวจว่าหมายเลขฤดูกาลตรงกับนาฬิกาเซิร์ฟเวอร์ จึงเร่งปิดก่อนกำหนดไม่ได้
//
// รีเซ็ตแบบครึ่งทาง ไม่ใช่กลับไปศูนย์
// ถ้ารีเซ็ตหมด คนเก่งต้องไล่ถล่มมือใหม่อยู่สองสัปดาห์กว่าจะกลับที่เดิม ซึ่งพังทั้งสองฝ่าย
// ─────────────────────────────────────────────────────────────

const SEASON_MS = 60 * 24 * 60 * 60 * 1000

export const SEASON_DAYS = 60

/** ตัวคูณตอนรีเซ็ต เก็บไว้ 45% ของแต้มเดิม */
export const SOFT_RESET_NUMER = 45
export const SOFT_RESET_DENOM = 100

export function seasonIndex(date = new Date()) {
  return Math.floor(date.getTime() / SEASON_MS)
}

export function seasonEndsAt(index = seasonIndex()) {
  return new Date((index + 1) * SEASON_MS)
}

export function daysLeft(index = seasonIndex()) {
  const ms = seasonEndsAt(index).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}

export function softReset(points = 0) {
  return Math.floor((points * SOFT_RESET_NUMER) / SOFT_RESET_DENOM)
}

/** รางวัลปลายฤดูกาลตามแรงค์สูงสุดที่ไปถึงในฤดูกาลนั้น */
export const SEASON_REWARDS = [
  { rank: 0, gems: 300, pool: {} },
  { rank: 1, gems: 800, pool: { SR: 20 } },
  { rank: 2, gems: 1500, pool: { SR: 40 } },
  { rank: 3, gems: 2500, pool: { SSR: 50 } },
  { rank: 4, gems: 4000, pool: { SSR: 100 } },
  { rank: 5, gems: 6000, pool: { SSR: 150 } },
  { rank: 6, gems: 9000, pool: { SSR: 250 } },
]

export function seasonRewardFor(rankIndex = 0) {
  return SEASON_REWARDS[Math.min(rankIndex, SEASON_REWARDS.length - 1)]
}

export function seasonMailId(index) {
  return `season-${index}`
}
