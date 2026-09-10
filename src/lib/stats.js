import { CHARACTERS, ELEMENTS } from '../data/characters'

export const LEVEL_GROWTH = 0.08
export const STAR_GROWTH = 0.15

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

/** ธาตุที่ตัวนี้ตีแรงใส่ และธาตุที่ตีแรงใส่ตัวนี้ */
export function elementMatchup(element) {
  const strongAgainst = ELEMENTS[element]?.beats ?? null
  const weakTo = Object.keys(ELEMENTS).find((k) => ELEMENTS[k].beats === element) ?? null
  return { strongAgainst, weakTo }
}

export function hasAdvantage(attackerElement, defenderElement) {
  return ELEMENTS[attackerElement]?.beats === defenderElement
}
