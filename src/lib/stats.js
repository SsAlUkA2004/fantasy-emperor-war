import { CHARACTERS, ELEMENTS } from '../data/characters'
import { skillLevelScale } from '../data/materials'
import {
  awakenSkillBoost,
  awakenStatBoost,
  effectiveRarity,
  tierBoost,
} from '../data/ascension'
import { levelCap } from './leveling'

export const LEVEL_GROWTH = 0.08
export const STAR_GROWTH = 0.15
export const STAR_SKILL_GROWTH = 0.1

/**
 * ตัวคูณที่ดาวเพิ่มให้กับสกิลและท่าไม้ตาย
 * ดาวจึงไม่ได้แค่ดันเพดานเลเวล แต่ทำให้ท่าแรงขึ้นจริง
 * ดาว 5 = สกิลแรงกว่าดาว 1 อยู่ 40%
 */
export function skillScale(star = 1) {
  return 1 + (star - 1) * STAR_SKILL_GROWTH
}

/**
 * ค่าพลังจริงหลังคูณเลเวลและดาว
 *
 * ทั้งเครื่องยนต์การต่อสู้และหน้าจอข้อมูลตัวละครเรียกฟังก์ชันนี้ตัวเดียวกัน
 * ถ้าแยกกันคำนวณ วันหนึ่งตัวเลขที่ผู้เล่นเห็นจะไม่ตรงกับที่ใช้สู้จริง
 */
export function effectiveStats(base, level = 1, star = 1) {
  const growth = 1 + (level - 1) * LEVEL_GROWTH
  const starBonus = 1 + (star - 1) * STAR_GROWTH
  const scale = growth * starBonus

  return {
    hp: Math.round(base.hp * scale),
    atk: Math.round(base.atk * scale),
    def: Math.round(base.def * scale),
    spd: base.spd,
    crit: base.crit,
  }
}

export function heroStats(charId, level, star) {
  const c = CHARACTERS[charId]
  return c ? effectiveStats(c.stats, level, star) : null
}

// ─────────────────────────────────────────────────────────────
// สามฟังก์ชันข้างล่างนี้คือแหล่งความจริงเดียวของ "ตัวละครตัวนี้เก่งแค่ไหน"
//
// ทั้งเครื่องยนต์การต่อสู้ หน้าจอข้อมูล และการคำนวณค่าพลังรวม เรียกชุดเดียวกันหมด
// ถ้าปล่อยให้แต่ละที่คูณโบนัสเอง วันหนึ่งตัวเลขที่ผู้เล่นเห็นจะไม่ตรงกับที่ใช้สู้จริง
// ─────────────────────────────────────────────────────────────

/** ค่าสถานะสุดท้าย รวมเลเวล ดาว การยกระดับ และการปลุกร่าง */
export function entryStats(charId, entry = {}) {
  const c = CHARACTERS[charId]
  if (!c) return null

  const base = effectiveStats(c.stats, entry.level ?? 1, entry.star ?? 1)
  const boost = tierBoost(entry.tier ?? 0) * awakenStatBoost(entry.awaken ?? 0)

  return {
    hp: Math.round(base.hp * boost),
    atk: Math.round(base.atk * boost),
    def: Math.round(base.def * boost),
    spd: Math.round(base.spd * boost),
    crit: base.crit,
  }
}

/** ตัวคูณความแรงของสกิล รวมดาว ระดับสกิล และการปลุกร่าง */
export function entrySkillScale(entry = {}) {
  return (
    skillScale(entry.star ?? 1) *
    skillLevelScale(entry.skillLevel ?? 1) *
    awakenSkillBoost(entry.awaken ?? 0)
  )
}

/** เพดานเลเวลตามความหายากจริงหลังยกระดับ */
export function entryLevelCap(charId, entry = {}) {
  return levelCap(effectiveRarity(charId, entry.tier ?? 0), entry.star ?? 1)
}

/** ธาตุที่ตัวนี้ตีแรงใส่ และธาตุที่ตีแรงใส่ตัวนี้ */
export function elementMatchup(element) {
  const strongAgainst = ELEMENTS[element]?.beats ?? null
  const weakTo = Object.keys(ELEMENTS).find((k) => ELEMENTS[k].beats === element) ?? null
  return { strongAgainst, weakTo }
}

export function hasAdvantage(attackerElement, defenderElement) {
  return ELEMENTS[attackerElement]?.beats === defenderElement
}
