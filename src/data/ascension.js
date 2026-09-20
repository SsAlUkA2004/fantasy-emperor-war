import { CHARACTERS, RARITIES } from './characters'

// ─────────────────────────────────────────────────────────────
// สองระบบปลายทางของการพัฒนาตัวละคร
//
// ยกระดับ (tier) — ดันความหายากขึ้นทีละขั้น R → SR → SSR
//   ดาวไม่รีเซ็ต เพดานเลเวลจึงขยับขึ้นทันที และค่าพลังพื้นฐานคูณเพิ่ม
//   ตัวระดับ R ที่ปั้นจนสุดจึงไล่ทันตัว SSR ได้จริง ไม่ใช่ของประดับ
//
// ปลุกร่าง (awaken) — เฉพาะตัวที่ความหายากถึง SSR แล้วและครบห้าดาว
//   ทำได้สามขั้น แต่ละขั้นเพิ่มค่าพลังและความแรงของสกิล
//
// ทั้งสองอย่างจ่ายด้วยวัสดุล้วน ไม่ใช้เพชร
// เพราะวัสดุมีเพดานรายวันอยู่แล้ว จึงกันการเร่งด้วยเงินไปในตัว
// ─────────────────────────────────────────────────────────────

export const MAX_TIER = 2
export const MAX_AWAKEN = 3

/** ชื่อของแต่ละขั้นปลุกร่าง ใช้แสดงแทนตัวเลขเปล่า ๆ */
export const AWAKEN_NAMES = ['', 'ตื่นรู้', 'แปรสภาพ', 'อุบัติใหม่']

export function awakenName(level = 0) {
  return AWAKEN_NAMES[level] ?? ''
}

/**
 * ยกระดับหนึ่งขั้น ค่าพลังพื้นฐานคูณเพิ่มเท่านี้
 *
 * เดิมตั้งไว้ 1.35 ซึ่งทำให้ตัว SR ที่ยกระดับขึ้นมาแซงตัว SSR แท้ได้
 * ตอนนั้นตั้งใจให้เป็นแบบนั้น เพื่อไม่ให้ตัวที่สุ่มได้ตอนแรกกลายเป็นขยะ
 *
 * ลดลงเป็น 1.22 เพราะตัวที่หายากกว่าควรเก่งกว่าเมื่อลงทุนเท่ากัน
 * การยกระดับยังจำเป็นอยู่ เพราะเป็นทางเดียวที่ตัว R กับ SR
 * จะขยับเพดานเลเวลจาก 50 ไปถึง 100 ได้
 */
export const TIER_BOOST = 1.12

/**
 * ตัวคูณตามระดับตั้งต้นจากกาชา ไม่ใช่ระดับหลังยกระดับ
 *
 * ใส่เข้ามาเพราะค่าพลังพื้นฐานของ SR กับ SSR ทับกันอยู่แล้วในตาราง
 * ตัว SR ที่แรงที่สุดมีค่าพลังสูงกว่าตัว SSR ที่อ่อนที่สุดตั้งแต่ยังไม่ยกระดับ
 * ต่อให้ลดตัวคูณยกระดับเหลือเท่าไหร่ก็แก้ไม่ได้
 *
 * ยกฐานของ SSR ขึ้น 18% แล้วชดเชยที่ตัวคูณศัตรูในด่านที่ใช้ทีม SSR เป็นฐาน
 * ความยากของด่านจึงไม่เปลี่ยน แต่ลำดับความแรงของตัวละครถูกต้องแล้ว
 *
 * UR อยู่นอกสายยกระดับ R → SR → SSR (ดู effectiveRarity/maxTierFor ด้านล่าง) จึงตั้งตัวคูณ
 * ของตัวเองไว้สูงกว่า SSR ชัดเจน ยืนยันด้วยการรันจำลองว่า UR แท้แรงกว่า SSR แท้เสมอที่เลเวล/ดาวเท่ากัน
 */
export const RARITY_POWER = { R: 1, SR: 1, SSR: 1.18, UR: 1.32 }

export function rarityPower(charId) {
  return RARITY_POWER[CHARACTERS[charId]?.rarity] ?? 1
}

/** ปลุกร่างหนึ่งขั้น เพิ่มค่าพลัง 12% และความแรงสกิล 5% */
export const AWAKEN_STAT = 0.12
export const AWAKEN_SKILL = 0.05

export const TIER_COST = {
  1: { ore: 800, crystal: 200, scroll: 60 },
  2: { ore: 2000, crystal: 600, scroll: 150 },
}

export const AWAKEN_COST = {
  1: { ore: 500, crystal: 250, scroll: 80 },
  2: { ore: 900, crystal: 500, scroll: 160 },
  3: { ore: 1600, crystal: 900, scroll: 300 },
}

/**
 * ความหายากจริงหลังยกระดับแล้ว
 *
 * UR ไม่อยู่ในลำดับ RARITIES (R/SR/SSR) เพราะไม่ใช่ปลายทางที่ตัวอื่นไต่ขึ้นมาได้
 * และตัวมันเองก็ไต่ขึ้นไปที่ไหนต่อไม่ได้อีกแล้ว จึงคืนค่า 'UR' ตรง ๆ โดยไม่ต้องคำนวณ
 */
export function effectiveRarity(charId, tier = 0) {
  const base = CHARACTERS[charId]?.rarity ?? 'R'
  if (base === 'UR') return 'UR'
  const index = Math.min(RARITIES.indexOf(base) + tier, RARITIES.length - 1)
  return RARITIES[index]
}

export function maxTierFor(charId) {
  const base = CHARACTERS[charId]?.rarity ?? 'R'
  if (base === 'UR') return 0
  return RARITIES.length - 1 - RARITIES.indexOf(base)
}

export function tierBoost(tier = 0) {
  return Math.pow(TIER_BOOST, tier)
}

export function awakenStatBoost(awaken = 0) {
  return 1 + awaken * AWAKEN_STAT
}

export function awakenSkillBoost(awaken = 0) {
  return 1 + awaken * AWAKEN_SKILL
}

export function tierCost(tier) {
  return TIER_COST[tier + 1] ?? null
}

export function awakenCost(awaken) {
  return AWAKEN_COST[awaken + 1] ?? null
}

/**
 * เช็คเงื่อนไขก่อนยกระดับ
 * ต้องครบห้าดาวและชนเพดานเลเวลแล้ว เพื่อไม่ให้ข้ามขั้นตอนการปั้น
 */
export function tierBlockers(charId, entry, cap) {
  const tier = entry.tier ?? 0
  if (tier >= maxTierFor(charId)) return ['ถึงความหายากสูงสุดแล้ว']

  const blockers = []
  if ((entry.star ?? 1) < 5) blockers.push('ต้องครบ 5 ดาวก่อน')
  if ((entry.level ?? 1) < cap) blockers.push(`ต้องดันเลเวลถึงเพดาน ${cap} ก่อน`)
  return blockers
}

export function awakenBlockers(charId, entry) {
  const awaken = entry.awaken ?? 0
  if (awaken >= MAX_AWAKEN) return ['ปลุกร่างครบทุกขั้นแล้ว']

  const blockers = []
  const rarity = effectiveRarity(charId, entry.tier ?? 0)
  if (rarity !== 'SSR' && rarity !== 'UR') blockers.push('ต้องเป็นระดับ SSR ขึ้นไปก่อน')
  if ((entry.star ?? 1) < 5) blockers.push('ต้องครบ 5 ดาวก่อน')
  return blockers
}
