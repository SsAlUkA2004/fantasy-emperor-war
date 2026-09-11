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

/** ยกระดับหนึ่งขั้น ค่าพลังพื้นฐานคูณเพิ่มเท่านี้ */
export const TIER_BOOST = 1.35

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

/** ความหายากจริงหลังยกระดับแล้ว */
export function effectiveRarity(charId, tier = 0) {
  const base = CHARACTERS[charId]?.rarity ?? 'R'
  const index = Math.min(RARITIES.indexOf(base) + tier, RARITIES.length - 1)
  return RARITIES[index]
}

export function maxTierFor(charId) {
  const base = CHARACTERS[charId]?.rarity ?? 'R'
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
  if (effectiveRarity(charId, entry.tier ?? 0) !== 'SSR') blockers.push('ต้องเป็นระดับ SSR ก่อน')
  if ((entry.star ?? 1) < 5) blockers.push('ต้องครบ 5 ดาวก่อน')
  return blockers
}
