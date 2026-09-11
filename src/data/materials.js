import { ENEMIES, getStage as getBaseStage } from './stages'

const e = (id, level) => ({ id, level })

export const MATERIALS = {
  ore: { id: 'ore', name: 'แร่เหล็กเวท', mark: '⛏', desc: 'วัสดุพื้นฐาน ใช้ในการอัปเกรดแทบทุกอย่าง' },
  crystal: { id: 'crystal', name: 'ผลึกธาตุ', mark: '💠', desc: 'ผลึกที่ยังมีพลังธาตุค้างอยู่ หายากกว่าแร่มาก' },
  scroll: { id: 'scroll', name: 'คัมภีร์สกิล', mark: '📜', desc: 'บันทึกวิชาโบราณ ใช้ยกระดับสกิลของตัวละคร' },
}

export const MATERIAL_IDS = Object.keys(MATERIALS)

export const EMPTY_BAG = { ore: 0, crystal: 0, scroll: 0 }

/**
 * ด่านหาของ ใช้โควตารวมกันวันละ 5 ครั้ง
 *
 * ของที่ดรอปเป็นจำนวนตายตัว ไม่สุ่ม เพราะ Security Rules ต้องตรวจได้ว่า
 * ของที่เพิ่มขึ้นตรงกับด่านที่ผู้เล่นผ่านมาแล้วจริงหรือเปล่า
 * ถ้าดรอปสุ่ม กฎจะตรวจไม่ได้เลยว่าเลขที่ส่งมาสมเหตุสมผลไหม
 */
export const MATERIAL_RUNS_PER_DAY = 5

export const MATERIAL_STAGES = [
  {
    id: 'm-1',
    name: 'เหมืองแร่ชายแดน',
    intro: 'แร่เวทฝังอยู่ตามผนัง แต่พวกมันไม่ยอมให้ขุดง่าย ๆ',
    materialStage: true,
    exp: 400,
    requires: '1-6',
    drops: { ore: 8, crystal: 0, scroll: 1 },
    enemies: [e('golem', 6), e('skeleton', 10)],
  },
  {
    id: 'm-2',
    name: 'ซากวิหารใต้ทราย',
    intro: 'ผลึกธาตุกองอยู่กลางห้อง เหมือนมีคนวางกับดักไว้',
    materialStage: true,
    exp: 1400,
    requires: '3-2',
    drops: { ore: 20, crystal: 4, scroll: 3 },
    enemies: [e('mummy', 8), e('efreet', 8), e('scorpion', 9)],
  },
  {
    id: 'm-3',
    name: 'คลังอาวุธเงามืด',
    intro: 'ของดีทั้งหมดอยู่ที่นี่ และมีคนเฝ้าอยู่ทั้งหมดเหมือนกัน',
    materialStage: true,
    exp: 4000,
    requires: '4-6',
    drops: { ore: 45, crystal: 12, scroll: 8 },
    enemies: [e('darkknight', 9), e('sentinel', 9), e('wraith', 10)],
  },
]

/**
 * สินค้าในร้าน ราคาตายตัวทั้งหมด
 * กฎอ่านราคาจากรายการเดียวกันนี้ ผู้เล่นจึงตั้งราคาเองไม่ได้
 */
export const SHOP = [
  { id: 'ore50', material: 'ore', amount: 50, price: 200 },
  { id: 'scroll10', material: 'scroll', amount: 10, price: 400 },
  { id: 'crystal10', material: 'crystal', amount: 10, price: 600 },
]

export const MAX_SKILL_LEVEL = 10

/** สกิลแรงขึ้น 6% ต่อระดับ เต็มที่ 10 ระดับ = แรงขึ้น 54% */
export const SKILL_STEP = 0.06

export function skillLevelScale(skillLevel = 1) {
  return 1 + (skillLevel - 1) * SKILL_STEP
}

/** ค่าใช้จ่ายในการดันสกิลจากระดับนี้ไประดับถัดไป คืน null ถ้าเต็มแล้ว */
export function skillUpgradeCost(skillLevel) {
  if (skillLevel >= MAX_SKILL_LEVEL) return null
  return {
    scroll: skillLevel + 1,
    ore: Math.round(10 * Math.pow(skillLevel, 1.5)),
    crystal: skillLevel >= 5 ? (skillLevel - 4) * 3 : 0,
  }
}

export function canAfford(bag, cost) {
  return MATERIAL_IDS.every((id) => (bag?.[id] ?? 0) >= (cost?.[id] ?? 0))
}

/**
 * ค้นหาด่านทุกประเภทจากที่เดียว
 *
 * materials.js นำเข้าจาก stages.js ทางเดียว ไม่นำเข้ากลับ
 * ถ้าให้ stages.js รู้จักด่านหาของด้วยจะเกิดการนำเข้าวนกัน
 * ทุกหน้าจึงเรียกฟังก์ชันนี้แทน getStage เดิม
 */
export function findStage(id) {
  return getBaseStage(id) ?? MATERIAL_STAGES.find((s) => s.id === id) ?? null
}

export { ENEMIES }
