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

/**
 * นโยบายการเข้ากิลด์
 *
 * แบบอนุมัติทำให้ผู้สมัครยื่นคำขอไว้ แล้วหัวหน้ากดอนุมัติ
 * หัวหน้าเขียนเอกสารของผู้สมัครไม่ได้ (กฎห้ามเขียนข้ามผู้ใช้)
 * จึงใช้วิธีให้หัวหน้าออกใบอนุมัติไว้ แล้วผู้สมัครเข้าเองโดยกฎตรวจใบนั้น
 */
export const JOIN_POLICIES = {
  open: { id: 'open', name: 'เข้าได้เลย', desc: 'ใครก็เข้าได้ทันทีถ้ากิลด์ยังไม่เต็ม' },
  approval: { id: 'approval', name: 'ต้องอนุมัติ', desc: 'ผู้สมัครยื่นคำขอ แล้วหัวหน้ากดรับ' },
}

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

/**
 * คะแนนต่อหนึ่งขั้นของเลเวลกิลด์ (คะแนนกิลด์ = ดาเมจที่สมาชิกตีบอสกิลด์รวมกัน)
 *
 * เดิม 5,000 ตอนที่ตีได้ราว 1 ล้านต่อครั้ง กิลด์ใหม่ก็ถึงเลเวล 20 (1.8 ล้านคะแนน) ในไม่กี่ครั้ง
 * ตอนนี้กิลด์ 10 คนที่เล่นครบทำได้ราว 0.5-1 พันล้านต่อสัปดาห์ ตั้งไว้ที่ 15 ล้านให้เลเวล 20
 * (5.4 พันล้านคะแนน) ใช้เวลาราวสองถึงสามเดือน ไม่ใช่สัปดาห์เดียว
 */
export const POINTS_PER_LEVEL_STEP = 15000000

/** เลเวลกิลด์ขึ้นตามคะแนนสะสมของสมาชิกทั้งกิลด์ */
export function guildLevel(points = 0) {
  return Math.max(1, Math.min(20, Math.floor(Math.sqrt(points / POINTS_PER_LEVEL_STEP)) + 1))
}

export function pointsForNextLevel(level) {
  return Math.pow(level, 2) * POINTS_PER_LEVEL_STEP
}
