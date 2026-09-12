// ─────────────────────────────────────────────────────────────
// บอสโลก
//
// บอสอยู่ในเอกสารเดียว มีเลือดก้อนเดียวที่ทุกคนช่วยกันตี ไม่ต้องรอคิว
// สองคนตีพร้อมกันไม่เป็นไร เพราะเขียนผ่าน transaction ของ Firestore
// ซึ่งจะลองใหม่ให้เองถ้ามีคนเขียนแทรก ดาเมจจึงถูกนับครบทั้งคู่
//
// การหมุนเวียนไม่ได้ใช้ตัวตั้งเวลาบนเซิร์ฟเวอร์
// แต่คำนวณหมายเลขสัปดาห์จากเวลาปัจจุบัน แล้วคนแรกที่เปิดหน้าในสัปดาห์ใหม่
// จะเป็นคนรีเซ็ตเลือดบอสให้เอง กฎตรวจว่าหมายเลขสัปดาห์ตรงกับนาฬิกาเซิร์ฟเวอร์จริง
// ─────────────────────────────────────────────────────────────

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** หมายเลขสัปดาห์นับจากยุคเวลา ใช้เป็นรหัสของบอสตัวปัจจุบัน */
export function weekIndex(date = new Date()) {
  return Math.floor(date.getTime() / WEEK_MS)
}

export function weekEndsAt(week = weekIndex()) {
  return new Date((week + 1) * WEEK_MS)
}

export const HITS_PER_DAY = 3

/**
 * เพดานดาเมจต่อหนึ่งครั้ง
 *
 * กฎตรวจได้แค่ว่าเลขอยู่ในช่วงที่เป็นไปได้ ไม่ได้พิสูจน์ว่าสู้จริง
 * คนที่แก้โค้ดจึงส่งเลขเต็มเพดานได้ แต่ถูกจำกัดด้วยจำนวนครั้งต่อวันอยู่ดี
 * มากสุดคือวันละสามครั้งคูณเพดาน ซึ่งเท่ากับคนที่ปั้นทีมมาสุดทางทำได้จริง
 */
export const DAMAGE_CAP = 3000000

/** บอสหมุนเวียนตามสัปดาห์ เลือดของบอสในสนามรบตั้งสูงมากเพื่อให้ตีไม่ตายในครั้งเดียว */
export const BOSSES = [
  {
    id: 'tyrant',
    name: 'ทรราชแห่งเถ้าถ่าน',
    element: 'fire',
    mark: '🔥',
    intro: 'มันตื่นขึ้นทุกสัปดาห์ และไม่เคยจำใครได้',
    poolHp: 60000000,
    stats: { hp: 90000000, atk: 520, def: 320, spd: 105, crit: 15 },
    skill: {
      name: 'เปลวลงทัณฑ์',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.8, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },
  {
    id: 'leviathan',
    name: 'วารีอสูรใต้สมุทร',
    element: 'water',
    mark: '🌊',
    intro: 'คลื่นสูงขึ้นก่อนที่ใครจะเห็นตัวมัน',
    poolHp: 70000000,
    stats: { hp: 95000000, atk: 480, def: 380, spd: 92, crit: 12 },
    skill: {
      name: 'วังวนกลืนกิน',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.35 },
      ],
    },
  },
  {
    id: 'behemoth',
    name: 'ปฐพีมหากาย',
    element: 'earth',
    mark: '🗻',
    intro: 'ภูเขาลูกหนึ่งลุกขึ้นยืน',
    poolHp: 80000000,
    stats: { hp: 110000000, atk: 440, def: 460, spd: 70, crit: 10 },
    skill: {
      name: 'แผ่นดินถล่ม',
      mp: 3,
      effects: [{ kind: 'damage', mult: 2.2, target: 'allFoes' }],
    },
  },
  {
    id: 'eclipse',
    name: 'เงาสุริยุปราคา',
    element: 'dark',
    mark: '🌘',
    intro: 'แสงหายไปก่อน แล้วมันจึงมาถึง',
    poolHp: 95000000,
    stats: { hp: 100000000, atk: 560, def: 340, spd: 120, crit: 20 },
    skill: {
      name: 'กลืนแสงสุดท้าย',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.7, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
  },
]

export function bossForWeek(week = weekIndex()) {
  return BOSSES[week % BOSSES.length]
}

/**
 * รางวัลแบ่งตามดาเมจสะสมทั้งสัปดาห์ ไม่ใช่ตามอันดับ
 *
 * ที่ไม่ใช้อันดับเพราะกฎตรวจอันดับไม่ได้ ต้องนับเทียบกับผู้เล่นทุกคน
 * แต่ดาเมจสะสมของตัวเองกฎอ่านจากเอกสารได้ตรง ๆ จึงตรวจได้จริง
 * ผลพลอยได้คือคนเล่นน้อยก็ยังได้รางวัล ไม่ใช่มีแต่สิบอันดับแรกที่ได้
 */
export const DAMAGE_TIERS = [
  { id: 1, need: 300000, gems: 200, pool: {} },
  { id: 2, need: 1000000, gems: 500, pool: { SR: 20 } },
  { id: 3, need: 3000000, gems: 1000, pool: { SR: 40 } },
  { id: 4, need: 8000000, gems: 1800, pool: { SSR: 50 } },
  { id: 5, need: 15000000, gems: 3000, pool: { SSR: 120 } },
]

export function tiersEarned(damage = 0) {
  return DAMAGE_TIERS.filter((t) => damage >= t.need)
}

export function claimKey(week, tierId) {
  return `${week}:${tierId}`
}
