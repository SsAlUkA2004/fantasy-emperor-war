/**
 * ตัวช่วยเทียบ "วันเดียวกันไหม" ตามเวลาไทย
 *
 * ใช้ชดเชย 7 ชั่วโมงแทนการอ่านโซนเวลาของเครื่อง เพราะฝั่ง Security Rules
 * ก็คำนวณด้วยวิธีเดียวกันเป๊ะ ถ้าสองฝั่งนับวันไม่ตรงกัน ผู้เล่นจะเจออาการ
 * กดได้ในหน้าจอแต่โดนกฎปฏิเสธ ซึ่งหาสาเหตุยากมาก
 */
const OFFSET_MS = 7 * 60 * 60 * 1000

function thaiDayKey(date) {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10)
}

export function isSameThaiDay(timestamp) {
  if (!timestamp) return false
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return thaiDayKey(date) === thaiDayKey(new Date())
}

/**
 * เหลือกี่ครั้งในวันนี้
 * รับชื่อฟิลด์เข้ามา เพราะเกมมีโควตารายวันมากกว่าหนึ่งชุด
 * (เหมืองคริสตัลใช้ gemRun* ส่วนด่านหาของใช้ matRun*)
 */
export function runsLeft(player, perDay, atField = 'gemRunAt', countField = 'gemRunCount') {
  if (!isSameThaiDay(player?.[atField])) return perDay
  return Math.max(0, perDay - (player[countField] ?? 0))
}

/** เที่ยงคืนไทยรอบถัดไป ไว้บอกผู้เล่นว่าอีกนานแค่ไหนจะรีเซ็ต */
export function hoursUntilReset() {
  const now = new Date()
  const thai = new Date(now.getTime() + OFFSET_MS)
  const next = new Date(thai)
  next.setUTCHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((next - thai) / 3600000))
}
