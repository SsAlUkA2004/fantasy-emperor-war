// ตัวเลขสมดุลทั้งเกมอยู่ในไฟล์นี้ไฟล์เดียว ปรับแล้ว push ระบบดีพลอยรันเอง

export const ENEMIES = {
  ratling: {
    id: 'ratling',
    name: 'หนูป่าเวท',
    element: 'wind',
    mark: '🐀',
    stats: { hp: 260, atk: 55, def: 20, spd: 88, crit: 5 },
  },
  skeleton: {
    id: 'skeleton',
    name: 'โครงกระดูกเดินได้',
    element: 'dark',
    mark: '💀',
    stats: { hp: 380, atk: 72, def: 40, spd: 70, crit: 5 },
  },
  frostwolf: {
    id: 'frostwolf',
    name: 'หมาป่าน้ำแข็ง',
    element: 'water',
    mark: '🐺',
    stats: { hp: 420, atk: 85, def: 35, spd: 100, crit: 10 },
  },
  hexer: {
    id: 'hexer',
    name: 'นักเวทเถื่อน',
    element: 'fire',
    mark: '🔮',
    stats: { hp: 340, atk: 95, def: 25, spd: 82, crit: 8 },
    skill: { name: 'ต้องสาปเพลิง', mp: 3, multiplier: 1.4, burn: 2 },
  },
  golem: {
    id: 'golem',
    name: 'กอเลมหินผู้เฝ้าประตู',
    element: 'earth',
    mark: '🗿',
    stats: { hp: 2150, atk: 140, def: 92, spd: 58, crit: 8 },
    boss: true,
  },
}

export const FIRST_CLEAR_GEMS = 30

export const STAGES = [
  {
    id: '1-1',
    exp: 25,
    name: 'ชายป่าฝั่งตะวันออก',
    intro: 'หนูป่าตัวหนึ่งขวางทางอยู่ ไม่ใช่เรื่องใหญ่',
    enemies: [{ id: 'ratling', level: 1 }],
  },
  {
    id: '1-2',
    exp: 35,
    name: 'ทางเดินใต้ร่มไม้',
    intro: 'คราวนี้มากันสองตัว',
    enemies: [
      { id: 'ratling', level: 1 },
      { id: 'ratling', level: 1 },
    ],
  },
  {
    id: '1-3',
    exp: 45,
    name: 'สุสานร้าง',
    intro: 'กระดูกที่ขยับได้เอง ไม่รู้ว่าใครปลุกมันขึ้นมา',
    enemies: [
      { id: 'skeleton', level: 1 },
      { id: 'skeleton', level: 1 },
    ],
  },
  {
    id: '1-4',
    exp: 55,
    name: 'ลำธารเยือกแข็ง',
    intro: 'ฝูงหมาป่าเร็วกว่าที่คิด ระวังโดนตัดหน้า',
    enemies: [
      { id: 'frostwolf', level: 1 },
      { id: 'frostwolf', level: 1 },
    ],
  },
  {
    id: '1-5',
    exp: 70,
    name: 'ค่ายพักของพวกนอกรีต',
    intro: 'นักเวทเถื่อนสาปให้ติดไฟได้ อย่าปล่อยให้มันร่ายซ้ำ',
    enemies: [
      { id: 'hexer', level: 1 },
      { id: 'hexer', level: 1 },
      { id: 'ratling', level: 1 },
    ],
  },
  {
    id: '1-6',
    exp: 120,
    name: 'ประตูหินโบราณ',
    intro: 'กอเลมยืนเฝ้ามาหลายร้อยปี ลำพังคนเดียวคงไม่พอ',
    enemies: [{ id: 'golem', level: 1 }],
  },
]

/**
 * ด่านฝึกฝน เล่นซ้ำได้ไม่จำกัด ให้ค่าประสบการณ์อย่างเดียว ไม่มีเพชร
 *
 * ที่ไม่ให้เพชรเพราะรางวัลที่ฟาร์มซ้ำได้ไม่จำกัดคือช่องโหว่ที่ Security Rules
 * ปิดไม่ได้เลย ส่วนค่าประสบการณ์ปลอดภัยกว่าเพราะมีเพดานเลเวลกั้นอยู่แล้ว
 * ด่านฟาร์มเพชรจะมาตอนที่ย้ายการคำนวณไปฝั่งเซิร์ฟเวอร์
 */
export const TRAINING = [
  {
    id: 't-1',
    name: 'ลานฝึกชั้นต้น',
    intro: 'หุ่นฟางที่ขยับได้ ไม่เจ็บใครแต่ทนได้นาน',
    training: true,
    exp: 90,
    requires: '1-2',
    enemies: [
      { id: 'skeleton', level: 3 },
      { id: 'skeleton', level: 3 },
    ],
  },
  {
    id: 't-2',
    name: 'ลานฝึกชั้นกลาง',
    intro: 'คู่ซ้อมที่เอาจริงขึ้น เตรียมใจไว้หน่อย',
    training: true,
    exp: 200,
    requires: '1-5',
    enemies: [
      { id: 'frostwolf', level: 8 },
      { id: 'hexer', level: 8 },
      { id: 'frostwolf', level: 8 },
    ],
  },
]

/**
 * ด่านเก็บเพชร จำกัดจำนวนครั้งต่อวัน
 *
 * ที่ต้องจำกัดเพราะรางวัลที่ฟาร์มได้ไม่จำกัดคือช่องโหว่ที่ปิดไม่ได้เลย
 * แต่พอจำกัดเป็นรายวัน กฎจะตรวจได้จริง เพราะเทียบวันจากนาฬิกาเซิร์ฟเวอร์
 * ไม่ใช่จากเครื่องผู้เล่น ต่อให้ตั้งเวลาเครื่องใหม่ก็ไม่ช่วย
 */
export const GEM_RUNS_PER_DAY = 3
export const GEM_REWARD = 60

export const GEM_STAGES = [
  {
    id: 'g-1',
    name: 'เหมืองคริสตัลร้าง',
    intro: 'คริสตัลยังฝังอยู่ในผนัง แต่มีอะไรบางอย่างเฝ้าไว้',
    gemStage: true,
    exp: 60,
    gems: GEM_REWARD,
    requires: '1-3',
    enemies: [
      { id: 'golem', level: 8 },
      { id: 'skeleton', level: 8 },
      { id: 'frostwolf', level: 8 },
    ],
  },
]

export function getStage(id) {
  return (
    STAGES.find((s) => s.id === id) ??
    TRAINING.find((s) => s.id === id) ??
    GEM_STAGES.find((s) => s.id === id) ??
    null
  )
}
