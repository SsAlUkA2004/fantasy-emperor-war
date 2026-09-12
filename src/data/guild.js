// ─────────────────────────────────────────────────────────────
// กิลด์
//
// จำนวนสมาชิกเป็นตัวเลขก้อนเดียวที่หลายคนแก้พร้อมกันได้
// จึงต้องเขียนผ่าน transaction เหมือนเลือดบอสโลก
// ถ้าเขียนตรง ๆ สองคนเข้าพร้อมกันแล้วตัวนับจะเพิ่มแค่หนึ่ง
//
// ค่าสร้างกิลด์คิดเป็นเพชร เพื่อไม่ให้มีกิลด์ร้างเต็มไปหมด
// ─────────────────────────────────────────────────────────────

export const MAX_MEMBERS = 30
export const CREATE_COST = 2000

export const GUILD_ROLES = {
  owner: { id: 'owner', name: 'หัวหน้า', rank: 2 },
  officer: { id: 'officer', name: 'รองหัวหน้า', rank: 1 },
  member: { id: 'member', name: 'สมาชิก', rank: 0 },
}

export const NAME_RULE = /^[\u0E00-\u0E7Fa-zA-Z0-9 ]{3,20}$/
export const TAG_RULE = /^[A-Z0-9]{2,5}$/

export function validateName(name) {
  const n = (name ?? '').trim()
  if (n.length < 3) return 'ชื่อกิลด์ต้องยาวอย่างน้อย 3 ตัวอักษร'
  if (n.length > 20) return 'ชื่อกิลด์ยาวได้ไม่เกิน 20 ตัวอักษร'
  if (!NAME_RULE.test(n)) return 'ใช้ได้เฉพาะไทย อังกฤษ ตัวเลข และเว้นวรรค'
  return null
}

export function validateTag(tag) {
  const t = (tag ?? '').trim().toUpperCase()
  if (!TAG_RULE.test(t)) return 'ตัวย่อต้องเป็นอังกฤษตัวใหญ่หรือตัวเลข 2 ถึง 5 ตัว'
  return null
}

/** เลเวลกิลด์ขึ้นตามคะแนนสะสมของสมาชิกทั้งกิลด์ */
export function guildLevel(points = 0) {
  return Math.max(1, Math.min(20, Math.floor(Math.sqrt(points / 5000)) + 1))
}

export function pointsForNextLevel(level) {
  return Math.pow(level, 2) * 5000
}
