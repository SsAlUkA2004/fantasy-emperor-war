// ─────────────────────────────────────────────────────────────
// ระบบอุปกรณ์
//
// ความแรงของชิ้นหนึ่งมาจากสามอย่างคูณกัน
//   1. ช่องสวมใส่  — กำหนดว่าเพิ่มค่าอะไร
//   2. ระดับสี     — ตัวคูณหลัก ขาวถึงชมพู
//   3. ระดับไอเทม  — มาจากบทที่ดรอป บทท้ายให้ของแรงกว่ามาก
//
// ที่แยกสามชั้นเพราะของสีเดียวกันจากบทที่ 1 กับบทที่ 5 ต้องไม่เท่ากัน
// ไม่งั้นผู้เล่นจะฟาร์มด่านแรกที่เร็วที่สุดแล้วไม่ต้องไปไหนเลย
// ─────────────────────────────────────────────────────────────

export const SLOTS = {
  weapon: { id: 'weapon', name: 'อาวุธ', mark: '⚔️', stat: 'atk', base: 28 },
  helmet: { id: 'helmet', name: 'หมวก', mark: '🪖', stat: 'hp', base: 140 },
  armor: { id: 'armor', name: 'เสื้อเกราะ', mark: '🛡️', stat: 'def', base: 20 },
  pants: { id: 'pants', name: 'กางเกง', mark: '👖', stat: 'hp', base: 180 },
  boots: { id: 'boots', name: 'รองเท้า', mark: '👢', stat: 'spd', base: 6 },
  ring: { id: 'ring', name: 'แหวน', mark: '💍', stat: 'crit', base: 2 },
}

export const SLOT_IDS = Object.keys(SLOTS)

export const GRADES = {
  white: { id: 'white', name: 'สามัญ', color: '#cfc9bb', mult: 1.0, order: 0, sell: 20 },
  green: { id: 'green', name: 'ชำนาญ', color: '#7fc98a', mult: 1.4, order: 1, sell: 60 },
  blue: { id: 'blue', name: 'หายาก', color: '#6fb2d6', mult: 2.0, order: 2, sell: 150 },
  purple: { id: 'purple', name: 'เยี่ยมยอด', color: '#b98ede', mult: 2.8, order: 3, sell: 400 },
  orange: { id: 'orange', name: 'ตำนาน', color: '#e0a05a', mult: 3.9, order: 4, sell: 900 },
  red: { id: 'red', name: 'เทพ', color: '#d96b5e', mult: 5.4, order: 5, sell: 2000 },
  pink: { id: 'pink', name: 'อมตะ', color: '#e88bc0', mult: 7.5, order: 6, sell: 4500 },
}

export const GRADE_IDS = Object.keys(GRADES)

/** ช่วงสีที่แต่ละแหล่งดรอปได้ ตามที่ออกแบบไว้ */
export const SOURCE_RANGE = {
  stage: ['white', 'blue'],
  dungeon: ['green', 'pink'],
  worldboss: ['purple', 'red'],
  guild: ['green', 'orange'],
  pvp: ['blue', 'pink'],
}

/** ระดับไอเทมเพิ่มค่าพลัง 60% ต่อระดับ บทที่ 5 จึงแรงกว่าบทที่ 1 ราว 3.4 เท่า */
export const ILVL_STEP = 0.6

/** ตีบวกหนึ่งขั้นเพิ่มค่าของชิ้นนั้น 8% */
export const PLUS_STEP = 0.08

export function gearStat(gear) {
  if (!gear) return 0
  const slot = SLOTS[gear.slot]
  const grade = GRADES[gear.grade]
  if (!slot || !grade) return 0

  const byIlvl = 1 + ((gear.ilvl ?? 1) - 1) * ILVL_STEP
  const byPlus = 1 + (gear.plus ?? 0) * PLUS_STEP
  return Math.round(slot.base * grade.mult * byIlvl * byPlus)
}

/** รวมค่าที่อุปกรณ์ทุกชิ้นของตัวละครหนึ่งตัวให้ */
export function gearBonus(list = []) {
  const total = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 }
  list.forEach((g) => {
    const slot = SLOTS[g.slot]
    if (slot) total[slot.stat] += gearStat(g)
  })
  return total
}

/**
 * สุ่มของหนึ่งชิ้น
 *
 * ยิ่งสีสูงยิ่งออกยาก ใช้น้ำหนักลดลงครึ่งหนึ่งต่อขั้น
 * ช่วงสีถูกจำกัดตามแหล่งที่มา จึงไม่มีทางได้ของสีชมพูจากด่านบทแรก
 */
export function rollGear(source, ilvl) {
  const [lo, hi] = SOURCE_RANGE[source] ?? SOURCE_RANGE.stage
  const from = GRADES[lo].order
  const to = GRADES[hi].order

  const pool = []
  for (let o = from; o <= to; o++) {
    const weight = Math.pow(0.45, o - from)
    pool.push({ order: o, weight })
  }

  const total = pool.reduce((s, p) => s + p.weight, 0)
  let pick = Math.random() * total
  let chosen = pool[0]
  for (const p of pool) {
    pick -= p.weight
    if (pick <= 0) {
      chosen = p
      break
    }
  }

  const grade = GRADE_IDS.find((g) => GRADES[g].order === chosen.order)
  const slot = SLOT_IDS[Math.floor(Math.random() * SLOT_IDS.length)]

  return { slot, grade, ilvl: Math.max(1, Math.min(5, ilvl)), plus: 0 }
}

/** โอกาสดรอปต่อการผ่านด่านหนึ่งครั้ง */
export const STAGE_DROP_CHANCE = 0.35

/** เหรียญที่ได้จากการผ่านด่าน ขึ้นกับบท */
export function coinsForStage(chapter = 1) {
  return 40 + (chapter - 1) * 55
}

/**
 * เพดานตีบวกผูกกับเลเวลผู้เล่น
 *
 * ผู้เล่นเลเวล 10 ตีบวกได้สูงสุด +10 จึงเป็นเหตุผลให้ดันเลเวลผู้เล่นต่อ
 * ซึ่งขึ้นจากของที่จำกัดต่อวันเท่านั้น อุปกรณ์แรง ๆ จึงเร่งด้วยการนั่งฟาร์มไม่ได้
 */
export const HARD_PLUS_CAP = 30

export function maxPlus(playerLevel = 1) {
  return Math.min(HARD_PLUS_CAP, Math.max(0, playerLevel))
}

/**
 * ค่าตีบวกขั้นถัดไป
 *
 * แพงขึ้นแบบเร่ง ไม่ใช่เชิงเส้น เพราะของชิ้นดีที่บวกสูงควรเป็นเป้าหมายระยะยาว
 * และผูกกับสีและระดับไอเทม ของดีจึงแพงกว่าของธรรมดาที่บวกเท่ากัน
 */
export const ENHANCE_BASE = 45

export function enhanceCost(gear) {
  if (!gear) return 0
  const next = (gear.plus ?? 0) + 1
  const grade = GRADES[gear.grade]?.mult ?? 1
  return Math.round(ENHANCE_BASE * Math.pow(next, 1.6) * grade * (gear.ilvl ?? 1))
}

/** หีบอุปกรณ์ในร้าน ซื้อด้วยเหรียญ ระดับไอเทมต้องผ่านบทนั้นมาก่อน */
export const GEAR_BOXES = [
  { id: 'box1', name: 'หีบอุปกรณ์ชายแดน', ilvl: 1, price: 600, requires: '1-6' },
  { id: 'box2', name: 'หีบอุปกรณ์ป่าหมอก', ilvl: 2, price: 1600, requires: '2-6' },
  { id: 'box3', name: 'หีบอุปกรณ์ทะเลทราย', ilvl: 3, price: 3400, requires: '3-6' },
  { id: 'box4', name: 'หีบอุปกรณ์ยอดเขา', ilvl: 4, price: 6200, requires: '4-6' },
  { id: 'box5', name: 'หีบอุปกรณ์ปราการเงา', ilvl: 5, price: 10500, requires: '5-6' },
]

export function gearName(gear) {
  if (!gear) return ''
  return `${SLOTS[gear.slot].name}${GRADES[gear.grade].name}`
}
