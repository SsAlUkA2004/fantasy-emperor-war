// ─────────────────────────────────────────────────────────────
// ข้อมูลตัวละครทั้งหมดอยู่ในโค้ด ไม่ได้อยู่ใน Firestore
// เหมือนกันทุกคน ไม่เคยเปลี่ยนระหว่างเล่น เก็บใน Firestore จะเสียโควตาอ่านฟรี ๆ
// Firestore เก็บเฉพาะ "ผู้เล่นคนนี้มีตัวไหน เลเวลเท่าไหร่ กี่ดาว"
//
// สกิลเขียนเป็นรายการผลลัพธ์ ไม่ใช่โค้ดเฉพาะตัว
// เครื่องยนต์อ่านรายการนี้แล้วทำตาม เพิ่มตัวละครใหม่จึงไม่ต้องแตะเครื่องยนต์เลย
//
// ชนิดของผลลัพธ์
//   damage  { mult, target, bonusOn, bonusMult }  ทำดาเมจ
//   heal    { percent, target }                   ฟื้นพลัง
//   status  { status, turns, target, chance }     ติดสถานะ
//   cleanse { target }                            ล้างสถานะติดลบ
// เป้าหมาย: one | allFoes | self | lowestAlly | allAllies
// ─────────────────────────────────────────────────────────────

export const ELEMENTS = {
  fire: { name: 'เพลิง', mark: '🔥', beats: 'wind' },
  water: { name: 'วารี', mark: '💧', beats: 'fire' },
  wind: { name: 'พายุ', mark: '🌪', beats: 'earth' },
  earth: { name: 'ปฐพี', mark: '🪨', beats: 'water' },
  light: { name: 'แสง', mark: '✨', beats: 'dark' },
  dark: { name: 'มืด', mark: '🌑', beats: 'light' },
}

export const ROLES = {
  striker: 'สายโจมตี',
  guardian: 'สายป้องกัน',
  mystic: 'สายสนับสนุน',
}

export const RARITIES = ['R', 'SR', 'SSR']

export const CHARACTERS = {
  // ───────── ตัวเริ่มต้น (SR) ─────────
  athen: {
    id: 'athen', name: 'อาเธน', epithet: 'นักดาบเปลวอัคนี',
    rarity: 'SR', element: 'fire', role: 'striker', starter: true,
    stats: { hp: 820, atk: 165, def: 55, spd: 105, crit: 15 },
    skill: {
      name: 'ฟันเพลิงคำราม', mp: 3,
      desc: 'โจมตีเดี่ยว 180% และทำให้เป้าหมายติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.8, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
    ultimate: {
      name: 'อัคนีมหาประลัย',
      desc: 'โจมตีเดี่ยว 400% ถ้าเป้าหมายติดไฟอยู่ ดาเมจคูณอีก 1.5 เท่า',
      effects: [{ kind: 'damage', mult: 4, target: 'one', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'เลือดน้อยแต่ต่อยหนักที่สุดในสามคน เหมาะกับคนที่ชอบจบเกมเร็ว',
  },
  galen: {
    id: 'galen', name: 'กาเลน', epithet: 'อัศวินโล่ศิลา',
    rarity: 'SR', element: 'earth', role: 'guardian', starter: true,
    stats: { hp: 1400, atk: 95, def: 120, spd: 72, crit: 5 },
    skill: {
      name: 'กำแพงปฐพี', mp: 3,
      desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ปฐพีสั่นสะเทือน',
      desc: 'โจมตีศัตรูทุกตัว 150% และมีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    blurb: 'อึดที่สุด ล้มยากมาก แต่กว่าจะฆ่าใครได้ต้องใช้หลายเทิร์น',
  },
  lumina: {
    id: 'lumina', name: 'ลูมินา', epithet: 'นักบวชแสงจันทร์',
    rarity: 'SR', element: 'light', role: 'mystic', starter: true,
    stats: { hp: 950, atk: 88, def: 70, spd: 90, crit: 8 },
    skill: {
      name: 'พรจันทรา', mp: 3,
      desc: 'ฟื้นพลังชีวิตเพื่อนที่เลือดน้อยที่สุด 30% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.3, target: 'lowestAlly' },
        { kind: 'cleanse', target: 'lowestAlly' },
      ],
    },
    ultimate: {
      name: 'ม่านแสงศักดิ์สิทธิ์',
      desc: 'ฟื้นพลังทั้งทีม 25% และให้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
      ],
    },
    blurb: 'ตัวเองบอบบาง แต่ทำให้ทั้งทีมอยู่รอดได้นานกว่าที่ควรจะเป็น',
  },

  // ───────── ระดับ R ─────────
  bren: {
    id: 'bren', name: 'เบรน', epithet: 'นักธนูแห่งไพร',
    rarity: 'R', element: 'wind', role: 'striker',
    stats: { hp: 620, atk: 118, def: 40, spd: 112, crit: 12 },
    skill: {
      name: 'ลูกศรเจาะลม', mp: 3, desc: 'โจมตีเดี่ยว 165%',
      effects: [{ kind: 'damage', mult: 1.65, target: 'one' }],
    },
    ultimate: {
      name: 'ห่าธนู', desc: 'โจมตีศัตรูทุกตัว 200%',
      effects: [{ kind: 'damage', mult: 2, target: 'allFoes' }],
    },
    blurb: 'เร็วที่สุดในบรรดาตัวระดับ R ได้ลงมือก่อนเกือบทุกครั้ง',
  },
  moss: {
    id: 'moss', name: 'มอสส์', epithet: 'หมอยาแห่งหุบเขา',
    rarity: 'R', element: 'earth', role: 'mystic',
    stats: { hp: 780, atk: 72, def: 68, spd: 84, crit: 5 },
    skill: {
      name: 'ยาพอกสมุนไพร', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 25%',
      effects: [{ kind: 'heal', percent: 0.25, target: 'lowestAlly' }],
    },
    ultimate: {
      name: 'ไอหมอกรักษา', desc: 'ฟื้นพลังทั้งทีม 18% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'หมอประจำทีมราคาถูก ฟื้นได้น้อยกว่าลูมินาแต่หาง่ายกว่ามาก',
  },
  torg: {
    id: 'torg', name: 'ทอร์ก', epithet: 'ทหารรับจ้างหน้าแผลเป็น',
    rarity: 'R', element: 'fire', role: 'guardian',
    stats: { hp: 1120, atk: 88, def: 95, spd: 66, crit: 5 },
    skill: {
      name: 'ตั้งการ์ด', mp: 3, desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น',
      effects: [{ kind: 'status', status: 'taunt', turns: 2, target: 'self' }],
    },
    ultimate: {
      name: 'เหวี่ยงขวานวงกว้าง', desc: 'โจมตีศัตรูทุกตัว 130% และเพิ่มป้องกันตัวเอง 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.3, target: 'allFoes' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    blurb: 'ยืนบังแทนคนอื่นได้ดีพอตัว ราคาที่จ่ายคือช้ามาก',
  },
  neria: {
    id: 'neria', name: 'เนเรีย', epithet: 'นักดาบสายน้ำ',
    rarity: 'R', element: 'water', role: 'striker',
    stats: { hp: 680, atk: 124, def: 48, spd: 98, crit: 10 },
    skill: {
      name: 'ฟันคลื่นซ้อน', mp: 3, desc: 'โจมตีเดี่ยว 175%',
      effects: [{ kind: 'damage', mult: 1.75, target: 'one' }],
    },
    ultimate: {
      name: 'วังวนสลาย', desc: 'โจมตีเดี่ยว 320% และล้างสถานะติดลบของตัวเอง',
      effects: [
        { kind: 'damage', mult: 3.2, target: 'one' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    blurb: 'ตัวเลือกที่ดีเวลาเจอศัตรูธาตุเพลิง ซึ่งมีเยอะในบทแรก',
  },
  corvin: {
    id: 'corvin', name: 'คอร์วิน', epithet: 'โจรเงามืด',
    rarity: 'R', element: 'dark', role: 'striker',
    stats: { hp: 640, atk: 130, def: 42, spd: 108, crit: 20 },
    skill: {
      name: 'แทงจุดตาย', mp: 3, desc: 'โจมตีเดี่ยว 160% แรงขึ้นเท่าตัวถ้าเป้าหมายสตันอยู่',
      effects: [{ kind: 'damage', mult: 1.6, target: 'one', bonusOn: 'stun', bonusMult: 2 }],
    },
    ultimate: {
      name: 'เงาทาบสามครั้ง', desc: 'โจมตีเดี่ยว 350%',
      effects: [{ kind: 'damage', mult: 3.5, target: 'one' }],
    },
    blurb: 'โอกาสคริติคอลสูงสุดในระดับ R เข้าคู่ได้ดีกับตัวที่ทำสตัน',
  },

  // ───────── ระดับ SR เพิ่มเติม ─────────
  zephyr: {
    id: 'zephyr', name: 'เซเฟียร์', epithet: 'จอมเวทพายุ',
    rarity: 'SR', element: 'wind', role: 'mystic',
    stats: { hp: 880, atk: 142, def: 58, spd: 96, crit: 10 },
    skill: {
      name: 'ใบมีดลม', mp: 3, desc: 'โจมตีศัตรูทุกตัว 120%',
      effects: [{ kind: 'damage', mult: 1.2, target: 'allFoes' }],
    },
    ultimate: {
      name: 'พายุหมุนกลืนฟ้า', desc: 'โจมตีศัตรูทุกตัว 260% และมีโอกาสหนึ่งในสามทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.33 },
      ],
    },
    blurb: 'ตัวกวาดฝูงที่ดีที่สุดก่อนถึงระดับ SSR ยิ่งศัตรูเยอะยิ่งคุ้ม',
  },
  iris: {
    id: 'iris', name: 'อีริส', epithet: 'อัศวินน้ำแข็ง',
    rarity: 'SR', element: 'water', role: 'guardian',
    stats: { hp: 1320, atk: 102, def: 112, spd: 78, crit: 6 },
    skill: {
      name: 'เกราะเหมันต์', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ม่านน้ำแข็งคุ้มภัย', desc: 'ให้เกราะทั้งทีม และเพิ่มป้องกันตัวเอง 3 เทิร์น',
      effects: [
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
      ],
    },
    blurb: 'อึดกว่ากาเลนเล็กน้อย และแจกเกราะให้ทั้งทีมได้ด้วย',
  },
  velka: {
    id: 'velka', name: 'เวลก้า', epithet: 'นักล่ารัตติกาล',
    rarity: 'SR', element: 'dark', role: 'striker',
    stats: { hp: 790, atk: 172, def: 52, spd: 102, crit: 18 },
    skill: {
      name: 'เขี้ยวราตรี', mp: 3, desc: 'โจมตีเดี่ยว 190%',
      effects: [{ kind: 'damage', mult: 1.9, target: 'one' }],
    },
    ultimate: {
      name: 'ล่าจนสิ้นลม', desc: 'โจมตีเดี่ยว 420% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายสตัน',
      effects: [{ kind: 'damage', mult: 4.2, target: 'one', bonusOn: 'stun', bonusMult: 1.5 }],
    },
    blurb: 'ดาเมจต่อตัวสูงสุดในระดับ SR ใช้จัดการตัวที่อันตรายที่สุดก่อน',
  },

  // ───────── ระดับ SSR ─────────
  solaris: {
    id: 'solaris', name: 'โซลาริส', epithet: 'เทพีอรุณรุ่ง',
    rarity: 'SSR', element: 'light', role: 'mystic',
    stats: { hp: 1150, atk: 148, def: 88, spd: 100, crit: 12 },
    skill: {
      name: 'แสงอรุณ', mp: 3, desc: 'ฟื้นพลังทั้งทีม 22% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.22, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'สุริยเทวบัญชา',
      desc: 'โจมตีศัตรูทุกตัว 240% ฟื้นพลังทั้งทีม 30% และให้เกราะทั้งทีม',
      effects: [
        { kind: 'damage', mult: 2.4, target: 'allFoes' },
        { kind: 'heal', percent: 0.3, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
      ],
    },
    blurb: 'ทำได้ทุกอย่างในตัวเดียว ทั้งฟื้น ทั้งกวาด ทั้งกันดาเมจ',
  },
  drakos: {
    id: 'drakos', name: 'ดราคอส', epithet: 'ราชันมังกรเพลิง',
    rarity: 'SSR', element: 'fire', role: 'striker',
    stats: { hp: 1080, atk: 215, def: 76, spd: 98, crit: 20 },
    skill: {
      name: 'ลมหายใจมังกร', mp: 3, desc: 'โจมตีศัตรูทุกตัว 150% และทำให้ติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
    ultimate: {
      name: 'เปลวสิ้นภพ',
      desc: 'โจมตีเดี่ยว 520% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายติดไฟอยู่',
      effects: [{ kind: 'damage', mult: 5.2, target: 'one', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'ติดไฟให้ทั้งสนามด้วยสกิล แล้วเก็บทีละตัวด้วยไม้ตายที่แรงขึ้นจากไฟนั้น',
  },
  umbra: {
    id: 'umbra', name: 'อูมบรา', epithet: 'เจ้าแห่งเงาไร้รูป',
    rarity: 'SSR', element: 'dark', role: 'guardian',
    stats: { hp: 1560, atk: 158, def: 128, spd: 86, crit: 10 },
    skill: {
      name: 'ม่านเงากลืนกิน', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และได้เกราะ',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ราตรีไร้ที่สิ้นสุด',
      desc: 'โจมตีศัตรูทุกตัว 280% และมีโอกาสครึ่งหนึ่งทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 2.8, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    blurb: 'ตัวป้องกันที่ตีแรงพอ ๆ กับสายโจมตี ล้มยากที่สุดในเกม',
  },
}

export const ALL_IDS = Object.keys(CHARACTERS)

export const STARTER_IDS = Object.values(CHARACTERS)
  .filter((c) => c.starter)
  .map((c) => c.id)

export const BY_RARITY = RARITIES.reduce((acc, r) => {
  acc[r] = ALL_IDS.filter((id) => CHARACTERS[id].rarity === r)
  return acc
}, {})

export const STARTING_GEMS = 500

// ขนาดทีมประกาศไว้ที่เดียว หน้าอื่นนำเข้าจากที่นี่
// ถ้าแยกกันถือเลข วันหนึ่งหน้าจัดทีมกับแถบทีมจะไม่ตรงกัน
export const TEAM_SIZE = 5

export function getCharacter(id) {
  return CHARACTERS[id] ?? null
}
