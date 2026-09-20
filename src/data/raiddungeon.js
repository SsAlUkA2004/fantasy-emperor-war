import { CHAPTERS, ENEMIES, chapterCleared } from './stages'
import { effectiveRarity } from './ascension'

// ─────────────────────────────────────────────────────────────
// ดันเจี้ยนเหรด — ดันเจี้ยนอุปกรณ์ปลายเกม
//
// เก้าผู้เฝ้าคลัง แบ่งเป็นสามระดับความยากระดับละสามตัว (ดู vaultguard/vaultknight/vaultlord
// ใน data/stages.js) ตีได้ตัวละ 5 ครั้งต่อชั่วโมง นับแยกกันทุกตัว ไม่ใช้โควตารวม
// รีเซ็ตทุกชั่วโมงแบบเดียวกับดันเจี้ยนรอยอดีต (ดู data/chardungeon.js)
//
// แต่ละระดับปลดล็อกด้วยพลังทีมจริง (จำนวนตัวละครระดับ SSR ขึ้นไปที่เลเวลถึงเกณฑ์)
// แทนที่จะผูกกับบทที่ผ่านเหมือนโหมดอื่น เพราะต่อให้ผ่านทุกบทแล้วแต่ตัวละครยังปั้นไม่ถึง
// ก็ไม่ควรเข้าโหมดยากได้ ส่วนระดับไอเทมของที่ดรอปยังยึดตามบทไกลสุดที่ผ่านมาแล้วเหมือนเดิม
// (ดู ilvlForChapter) ระดับความยากของดันเจี้ยนนี้คุมแค่ช่วงสีที่ดรอปได้เท่านั้น
// ─────────────────────────────────────────────────────────────

const HOUR_MS = 60 * 60 * 1000

export function hourIndex(date = new Date()) {
  return Math.floor(date.getTime() / HOUR_MS)
}

export function hourStartsAt(hour) {
  return new Date(hour * HOUR_MS)
}

export function minutesLeft(hour = hourIndex()) {
  return Math.max(0, Math.ceil((hourStartsAt(hour + 1).getTime() - Date.now()) / 60000))
}

export const RUNS_PER_BOSS = 5

export const RAID_TIERS = [
  {
    id: 'easy',
    name: 'ง่าย',
    source: 'raidEasy',
    gradeRange: ['white', 'blue'],
    need: { count: 3, level: 75 },
    bosses: ['vaultguard1', 'vaultguard2', 'vaultguard3'],
    reward: { coins: 2000, exp: 6000 },
  },
  {
    id: 'medium',
    name: 'ปานกลาง',
    source: 'raidMedium',
    gradeRange: ['blue', 'orange'],
    need: { count: 3, level: 85 },
    bosses: ['vaultknight1', 'vaultknight2', 'vaultknight3'],
    reward: { coins: 4000, exp: 12000 },
  },
  {
    id: 'hard',
    name: 'ยาก',
    source: 'raidHard',
    gradeRange: ['orange', 'pink'],
    need: { count: 5, level: 90 },
    bosses: ['vaultlord1', 'vaultlord2', 'vaultlord3'],
    reward: { coins: 7000, exp: 20000 },
  },
]

/** ใช้แสดงผล/อ้างอิงข้อมูลของระดับหนึ่ง ล้มเหลวแล้วคืนระดับง่ายแทนเพื่อให้ UI ไม่พัง */
export function raidTier(tierId) {
  return RAID_TIERS.find((t) => t.id === tierId) ?? RAID_TIERS[0]
}

/**
 * เช็คว่ามีตัวละครระดับ SSR ขึ้นไป (นับ UR ด้วยเพราะแรงกว่า SSR ทุกด้าน) ที่เลเวลถึงเกณฑ์
 * ครบตามจำนวนที่ระดับความยากนั้นต้องการหรือยัง — เป็นเงื่อนไขปลดล็อก ไม่ใช่การบังคับทีมที่ใช้สู้จริง
 */
export function meetsRequirement(owned, need) {
  const count = (owned ?? []).filter((o) => {
    const r = effectiveRarity(o.id, o.tier ?? 0)
    return (r === 'SSR' || r === 'UR') && (o.level ?? 1) >= need.level
  }).length
  return count >= need.count
}

/** บทไกลสุดที่ผ่านครบต่อเนื่องมาแล้ว (นับจากบทที่ 1 ไล่ไป หยุดที่บทแรกที่ยังไม่ครบ) */
export function furthestChapter(progress = {}) {
  let n = 0
  for (const ch of CHAPTERS) {
    if (!chapterCleared(progress, ch.number)) break
    n = ch.number
  }
  return n
}

/** ระดับไอเทมของที่ดรอปในดันเจี้ยนนี้ ยึดตามบทไกลสุดที่ผ่านมาแล้ว เหมือนของดรอปในด่านเนื้อเรื่อง */
export function ilvlForChapter(chapter) {
  return Math.max(1, Math.min(5, chapter))
}

/**
 * ประกอบด่านบอสตัวหนึ่งขึ้นมาจากระดับความยากและลำดับ (0-2)
 *
 * ไม่เก็บเป็นรายการสำเร็จรูป ประกอบจากรหัสตอนเรียกใช้เหมือนชั้นดันเจี้ยนหอคอยและด่านรอยอดีต
 * (ดู findStage ใน data/materials.js) คืนค่า null ถ้าระดับความยากหรือลำดับไม่มีจริง
 */
export function raidBossStage(tierId, index) {
  const tier = RAID_TIERS.find((t) => t.id === tierId)
  const bossId = tier?.bosses?.[index]
  const boss = bossId ? ENEMIES[bossId] : null
  if (!tier || !boss) return null

  return {
    id: `r-${tierId}-${index}`,
    raidDungeon: true,
    tierId,
    bossId,
    name: boss.name,
    intro: 'ผู้เฝ้าคลังยืนขวางทางอยู่ ต้องโค่นมันก่อนถึงจะปล้นของในคลังได้',
    exp: tier.reward.exp,
    coins: tier.reward.coins,
    enemies: [{ id: bossId, level: 1, star: 1 }],
  }
}
