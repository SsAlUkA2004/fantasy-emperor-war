import { BOSSES } from './worldboss'

// ─────────────────────────────────────────────────────────────
// กิลด์เรด
//
// บอสของกิลด์ตัวเอง ไม่ใช่ของทั้งเซิร์ฟเวอร์
// เลือดน้อยกว่าบอสโลกมาก เพราะช่วยกันตีแค่ในกิลด์ซึ่งมีไม่เกินสามสิบคน
//
// ดาเมจที่ทำได้กลายเป็นสองอย่างพร้อมกัน
//   1. คะแนนสะสมของกิลด์ ใช้ดันเลเวลกิลด์
//   2. เหรียญกิลด์ของตัวเอง ใช้ซื้อของในร้านค้ากิลด์
// ─────────────────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const RAID_HITS_PER_DAY = 3
export const RAID_DAMAGE_CAP = 3000000

/** ดาเมจหนึ่งพันแลกเหรียญกิลด์หนึ่งเหรียญ */
export const DAMAGE_PER_COIN = 1000

export function raidWeek(date = new Date()) {
  return Math.floor(date.getTime() / WEEK_MS)
}

/** ใช้บอสชุดเดียวกับบอสโลก แต่คนละตัวในสัปดาห์เดียวกัน */
export function raidBossForWeek(week = raidWeek()) {
  return BOSSES[(week + 2) % BOSSES.length]
}

/** เลือดของบอสกิลด์ ตั้งไว้ราวหนึ่งในห้าของบอสโลก */
export function raidPoolHp(spec) {
  return Math.round(spec.poolHp * 0.22)
}

export function coinsFromDamage(damage = 0) {
  return Math.floor(damage / DAMAGE_PER_COIN)
}
