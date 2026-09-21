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
 * เพดานดาเมจต่อหนึ่งครั้ง (40 ล้าน)
 *
 * ต้องตรงกับเพดานในกฎ firestore.rules ของเอกสาร worldboss และเอกสารดาเมจรายคนใต้มัน (ตัวเลข 40000000)
 * กฎตรวจได้แค่ว่าเลขอยู่ในช่วงที่เป็นไปได้ ไม่ได้พิสูจน์ว่าสู้จริง
 * คนที่แก้โค้ดจึงส่งเลขเต็มเพดานได้ แต่ถูกจำกัดด้วยจำนวนครั้งต่อวันอยู่ดี
 * มากสุดคือวันละสามครั้งคูณเพดาน ซึ่งเท่ากับคนที่ปั้นทีมมาสุดทางทำได้จริง
 */
export const DAMAGE_CAP = 40000000

/**
 * บอสหมุนเวียนตามสัปดาห์
 *
 * poolHp คือเลือดก้อนกลางที่ทุกคนช่วยกันตี ตั้งตามกำลังของผู้เล่นจริงในแพทปัจจุบัน
 * (ผู้เล่นราว 10 คน มีอุปกรณ์เทพนิยาย 1 คน อมตะ 3 คน ที่เหลืออุปกรณ์ต่ำกว่า) ทีมแรงสุดตีได้ 20-30 ล้านต่อครั้ง
 * อมตะ 9-14 ล้าน คนอื่นราว 1-2 ล้าน ตีเต็มโควตา 21 ครั้งต่อบอสต่อสัปดาห์รวมกันราว 1.5 พันล้านถ้าทุกคนเล่นครบ
 * เลือด 0.9-1.4 พันล้านจึงล้มได้ตอนท้ายสัปดาห์ถ้าเล่นกันครบ ไม่ใช่หมดวันแรก และไม่ใช่ล้มไม่ได้เลย
 * ถ้าผู้เล่นเพิ่มขึ้นมากหรืออุปกรณ์ดีขึ้น ให้ขยับ poolHp ตามจำนวนนี้
 *
 * stats.hp คือเลือดในสนามรบของการตีหนึ่งครั้ง ตั้งไว้สูงกว่า DAMAGE_CAP หลายเท่าเพื่อให้ตีไม่ตายในครั้งเดียว
 * ถ้าบอสตายในสนามดาเมจจะถูกตัดที่เลือดนั้น
 */
export const BOSSES = [
  {
    id: 'tyrant',
    name: 'ทรราชแห่งเถ้าถ่าน',
    element: 'fire',
    mark: '🔥',
    intro: 'มันตื่นขึ้นทุกสัปดาห์ และไม่เคยจำใครได้',
    poolHp: 900000000,
    stats: { hp: 200000000, atk: 520, def: 320, spd: 105, crit: 15 },
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
    poolHp: 1050000000,
    stats: { hp: 200000000, atk: 480, def: 380, spd: 92, crit: 12 },
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
    poolHp: 1200000000,
    stats: { hp: 200000000, atk: 440, def: 460, spd: 70, crit: 10 },
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
    poolHp: 1425000000,
    stats: { hp: 200000000, atk: 560, def: 340, spd: 120, crit: 20 },
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
 * บอสโลกตัวที่สอง — สู้แยกก้อนเลือดกับตัวแรกและมีโควตาการโจมตีรายวันของตัวเอง
 * (ดู HITS_PER_DAY_2 กับฟิลด์ boss2RunAt/boss2RunCount ใน lib/worldboss.js)
 * ผู้เล่นจึงตีได้ทั้งสองตัวในวันเดียวกัน ไม่แย่งโควตากับตัวแรก
 */
export const HITS_PER_DAY_2 = 3

export const BOSSES_2 = [
  {
    id: 'aetherfang',
    name: 'เขี้ยวชั้นบรรยากาศ',
    element: 'wind',
    mark: '🌪',
    intro: 'มันโฉบผ่านก่อนที่ใครจะทันมองเห็นตัว',
    poolHp: 975000000,
    stats: { hp: 200000000, atk: 560, def: 300, spd: 135, crit: 22 },
    skill: {
      name: 'พายุเขี้ยวคม',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.75, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  {
    id: 'luminarch',
    name: 'จอมทัพแสงสูงสุด',
    element: 'light',
    mark: '✨',
    intro: 'แสงจ้าจนต้องหรี่ตา ก่อนจะเห็นว่ามันใหญ่แค่ไหน',
    poolHp: 1125000000,
    stats: { hp: 200000000, atk: 500, def: 360, spd: 100, crit: 14 },
    skill: {
      name: 'พิพากษาจากบัลลังก์แสง',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.65, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  {
    id: 'frostwyrm',
    name: 'มังกรน้ำแข็งนิรันดร์',
    element: 'water',
    mark: '❄️',
    intro: 'ลมหายใจของมันแช่แข็งทุกอย่างที่สัมผัส',
    poolHp: 1080000000,
    stats: { hp: 200000000, atk: 470, def: 400, spd: 90, crit: 12 },
    skill: {
      name: 'ลมหายใจเยือกแข็ง',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.4 },
      ],
    },
  },
  {
    id: 'duskbehemoth',
    name: 'มหากายแห่งสนธยา',
    element: 'dark',
    mark: '🌑',
    intro: 'เงาของมันทอดยาวก่อนที่ตัวมันจะมาถึงเสมอ',
    poolHp: 1350000000,
    stats: { hp: 200000000, atk: 530, def: 420, spd: 110, crit: 18 },
    skill: {
      name: 'เงาสนธยากลืนกิน',
      mp: 3,
      effects: [
        { kind: 'damage', mult: 1.9, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },
]

export function bossForWeek2(week = weekIndex()) {
  return BOSSES_2[week % BOSSES_2.length]
}

/** รวมบอสทั้งสองสายไว้ที่เดียว ให้ battle.js หาสเปกได้โดยไม่ต้องรู้ว่าใครมาจากสายไหน */
export const ALL_BOSS_SPECS = [...BOSSES, ...BOSSES_2]

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
  // สองขั้นบนเพิ่มมาพร้อมการขยายเลือดบอส ขั้นเดิมทั้งห้าไม่แตะ ทั้งดาเมจที่ต้องใช้และของรางวัล
  // ขั้น 6 ทีมอุปกรณ์เทพ (~2 ล้านต่อครั้ง) สะสมได้ในราวสัปดาห์เดียว ขั้น 7 ต้องอุปกรณ์อมตะขึ้นไป
  { id: 6, need: 40000000, gems: 3800, pool: { SSR: 180 } },
  { id: 7, need: 120000000, gems: 5500, pool: { SSR: 300 } },
]

export function tiersEarned(damage = 0) {
  return DAMAGE_TIERS.filter((t) => damage >= t.need)
}

export function claimKey(week, tierId) {
  return `${week}:${tierId}`
}
