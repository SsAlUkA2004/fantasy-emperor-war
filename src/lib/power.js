import { CHARACTERS } from '../data/characters'
import { ENEMIES } from '../data/stages'
import { effectiveStats, entryStats, skillScale } from './stats'

// ─────────────────────────────────────────────────────────────
// ค่าพลังรวม (CP) ย่อค่าสถานะห้าอย่างให้เหลือตัวเลขเดียว
//
// น้ำหนักไม่เท่ากันเพราะค่าแต่ละตัวมีผลต่อการรบไม่เท่ากัน
// พลังโจมตีคูณตรงเข้าสูตรดาเมจ จึงถ่วงหนักสุด
// พลังชีวิตมีตัวเลขใหญ่อยู่แล้ว จึงถ่วงเบาสุดเพื่อไม่ให้ตัวถังกลบทุกอย่าง
// ดาวคูณท้ายสุด เพราะดาวทำให้สกิลแรงขึ้นด้วย ไม่ใช่แค่ค่าสถานะ
//
// ตัวเลขนี้ใช้เทียบความแข็งแกร่งเท่านั้น ไม่ได้เข้าไปอยู่ในสูตรการต่อสู้
// ─────────────────────────────────────────────────────────────

const WEIGHTS = { hp: 0.3, atk: 4.2, def: 3, spd: 2.5, crit: 6 }

export function combatPower(stats, star = 1) {
  const raw =
    stats.hp * WEIGHTS.hp +
    stats.atk * WEIGHTS.atk +
    stats.def * WEIGHTS.def +
    stats.spd * WEIGHTS.spd +
    stats.crit * WEIGHTS.crit

  return Math.round(raw * skillScale(star))
}

export function heroPower(charId, level = 1, star = 1) {
  const c = CHARACTERS[charId]
  if (!c) return 0
  return combatPower(effectiveStats(c.stats, level, star), star)
}

/** ค่าพลังของตัวละครที่ผู้เล่นมีจริง รวมการยกระดับและปลุกร่าง */
export function entryPower(entry = {}) {
  const stats = entryStats(entry.id, entry)
  if (!stats) return 0
  return combatPower(stats, entry.star ?? 1)
}

export function teamPower(entries = []) {
  return entries.reduce((sum, e) => sum + entryPower(e), 0)
}

export function stagePower(stage) {
  if (!stage?.enemies) return 0
  return stage.enemies.reduce((sum, x) => {
    const m = ENEMIES[x.id]
    return m ? sum + combatPower(effectiveStats(m.stats, x.level, 1), 1) : sum
  }, 0)
}

/**
 * เทียบพลังทีมกับพลังศัตรู แล้วบอกว่าน่าจะรอดไหม
 * เกณฑ์มาจากการรันจำลองการต่อสู้จริง ไม่ได้ตั้งขึ้นมาลอย ๆ
 */
export function matchup(teamCp, stageCp) {
  if (!stageCp) return { level: 'unknown', label: '' }
  const ratio = teamCp / stageCp

  // เกณฑ์มาจากการรันจำลอง 270 คู่ทั่วทุกด่านทุกเลเวล
  // 0.85 ขึ้นไปชนะราว 90-100% / 0.55 ขึ้นไปราว 72-79% / 0.4 ขึ้นไปราว 20% / ต่ำกว่านั้นแพ้ทุกครั้ง
  if (ratio >= 0.85) return { level: 'easy', label: 'ได้เปรียบ' }
  if (ratio >= 0.55) return { level: 'fair', label: 'สูสี' }
  if (ratio >= 0.4) return { level: 'hard', label: 'เสียเปรียบ' }
  return { level: 'danger', label: 'อันตราย' }
}

export function formatPower(n) {
  return Math.round(n).toLocaleString('th-TH')
}
