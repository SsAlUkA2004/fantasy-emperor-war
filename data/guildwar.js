// ─────────────────────────────────────────────────────────────
// ศึกชิงธง — กิลด์ปะทะกิลด์
//
// ผมไม่ได้ทำเป็นการจับคู่กิลด์ต่อกิลด์ เพราะการจับคู่ต้องมีคนกลางตัดสินว่า
// ใครเจอใคร ซึ่งไม่มีเซิร์ฟเวอร์ก็ทำไม่ได้ และถ้าให้ฝั่งผู้เล่นเขียนเอกสารของกิลด์อื่น
// ก็ต้องเปิดสิทธิ์ให้เขียนข้ามกิลด์ ซึ่งอันตรายกว่าที่มันคุ้ม
//
// ใช้กระดานคะแนนร่วมแทน ทุกกิลด์แข่งกันบนกระดานเดียว
// สมาชิกเขียนได้แค่คะแนนของกิลด์ตัวเอง จึงไม่ต้องเปิดสิทธิ์ข้ามกิลด์เลย
// และใช้ได้ตั้งแต่มีกิลด์เดียวไปจนถึงหลายสิบกิลด์
// ─────────────────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const ATTACKS_PER_DAY = 5

export function warWeek(date = new Date()) {
  return Math.floor(date.getTime() / WEEK_MS)
}

export function warEndsAt(week = warWeek()) {
  return new Date((week + 1) * WEEK_MS)
}

export function daysLeft(week = warWeek()) {
  return Math.max(0, Math.ceil((warEndsAt(week).getTime() - Date.now()) / 86400000))
}

/**
 * คะแนนที่ได้ต่อหนึ่งครั้ง
 *
 * ชนะได้เต็ม แพ้ได้ครึ่งเดียวแต่ไม่เป็นศูนย์
 * เพราะถ้าแพ้แล้วไม่ได้อะไรเลย สมาชิกที่ทีมอ่อนกว่าจะเลิกลงให้กิลด์ตั้งแต่วันแรก
 */
export const WIN_POINTS = 100
export const LOSS_POINTS = 40

/** โบนัสตามระดับของคู่แข่งเทียบกับเรา สูงสุดบวกลบครึ่งหนึ่ง */
export function warPoints(won, myCp = 1, foeCp = 1) {
  const ratio = Math.max(0.5, Math.min(1.5, foeCp / Math.max(1, myCp)))
  const base = won ? WIN_POINTS : LOSS_POINTS
  return Math.round(base * ratio)
}

/** เหรียญกิลด์ที่ผู้เล่นได้ติดมือ คิดจากคะแนนที่ทำให้กิลด์ */
export function coinsFromPoints(points = 0) {
  return Math.round(points * 0.6)
}

/** ระดับรางวัลตามคะแนนกิลด์ ใช้แสดงเป้าหมายบนกระดาน */
export const WAR_TIERS = [
  { need: 1000, name: 'ธงทองแดง' },
  { need: 5000, name: 'ธงเงิน' },
  { need: 15000, name: 'ธงทอง' },
  { need: 40000, name: 'ธงเพลิง' },
  { need: 100000, name: 'ธงอมตะ' },
]

export function bannerFor(points = 0) {
  return [...WAR_TIERS].reverse().find((t) => points >= t.need)?.name ?? 'ยังไม่มีธง'
}
