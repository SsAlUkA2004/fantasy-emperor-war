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
    name: 'ชายป่าฝั่งตะวันออก',
    intro: 'หนูป่าตัวหนึ่งขวางทางอยู่ ไม่ใช่เรื่องใหญ่',
    enemies: [{ id: 'ratling', level: 1 }],
  },
  {
    id: '1-2',
    name: 'ทางเดินใต้ร่มไม้',
    intro: 'คราวนี้มากันสองตัว',
    enemies: [
      { id: 'ratling', level: 1 },
      { id: 'ratling', level: 1 },
    ],
  },
  {
    id: '1-3',
    name: 'สุสานร้าง',
    intro: 'กระดูกที่ขยับได้เอง ไม่รู้ว่าใครปลุกมันขึ้นมา',
    enemies: [
      { id: 'skeleton', level: 1 },
      { id: 'skeleton', level: 1 },
    ],
  },
  {
    id: '1-4',
    name: 'ลำธารเยือกแข็ง',
    intro: 'ฝูงหมาป่าเร็วกว่าที่คิด ระวังโดนตัดหน้า',
    enemies: [
      { id: 'frostwolf', level: 1 },
      { id: 'frostwolf', level: 1 },
    ],
  },
  {
    id: '1-5',
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
    name: 'ประตูหินโบราณ',
    intro: 'กอเลมยืนเฝ้ามาหลายร้อยปี ลำพังคนเดียวคงไม่พอ',
    enemies: [{ id: 'golem', level: 1 }],
  },
]

export function getStage(id) {
  return STAGES.find((s) => s.id === id) ?? null
}
