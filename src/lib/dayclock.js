/**
 * ตัวช่วยเทียบ "วันเดียวกันไหม" ของเกม
 *
 * โควตารายวันทุกชุดรีเซ็ตตอน 21:00 เวลาไทย (สามทุ่ม) ไม่ใช่เที่ยงคืน
 * ใช้การชดเชยเวลาแทนการอ่านโซนเวลาของเครื่อง เพื่อให้ทุกเครื่องคำนวณ "วันของเกม" ตรงกันเป๊ะ
 * ไม่ว่าจะตั้งเขตเวลาเครื่องไว้ยังไง (ปรับเปลี่ยนแค่ RESET_HOUR ถ้าอยากขยับเวลารีเซ็ตอีก)
 */
const RESET_HOUR = 21
const THAI_OFFSET_MS = 7 * 60 * 60 * 1000
const OFFSET_MS = THAI_OFFSET_MS - RESET_HOUR * 60 * 60 * 1000

function thaiDayKey(date) {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10)
}

/** รหัสวันตามเวลาไทย เช่น 2026-09-13 ใช้เป็นรหัสจดหมายรายวัน */
export function todayKey() {
  return thaiDayKey(new Date())
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

/** เวลารีเซ็ต (21:00 ไทย) รอบถัดไป ไว้บอกผู้เล่นว่าอีกนานแค่ไหนจะรีเซ็ต */
export function hoursUntilReset() {
  const now = new Date()
  const thai = new Date(now.getTime() + OFFSET_MS)
  const next = new Date(thai)
  next.setUTCHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((next - thai) / 3600000))
}
