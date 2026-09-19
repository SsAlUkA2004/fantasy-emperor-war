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

/** สนามที่ตัวละครถนัด ใช้แนะนำผู้เล่นว่าควรปั้นใครก่อน */
export const FOCUS = {
  farm: { id: 'farm', name: 'ไล่เก็บด่าน', mark: '🗺️' },
  pvp: { id: 'pvp', name: 'ประลอง', mark: '⚔️' },
  boss: { id: 'boss', name: 'ตีบอส', mark: '🐲' },
  all: { id: 'all', name: 'ใช้ได้ทุกสนาม', mark: '✨' },
}

export const CHARACTERS = {
  // ───────── ตัวเริ่มต้น (SR) ─────────
  athen: {
    id: 'athen', name: 'อาเธน', epithet: 'นักดาบเปลวอัคนี',
    rarity: 'SR', element: 'fire', role: 'striker', starter: true,
    stats: { hp: 820, atk: 165, def: 55, spd: 105, crit: 15, critRate: 15 },
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
    stats: { hp: 1400, atk: 95, def: 120, spd: 72, crit: 5, critRate: 10 },
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
    stats: { hp: 950, atk: 88, def: 70, spd: 90, crit: 8, critRate: 10 },
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
    stats: { hp: 620, atk: 118, def: 40, spd: 112, crit: 12, critRate: 15 },
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
    stats: { hp: 780, atk: 72, def: 68, spd: 84, crit: 5, critRate: 10 },
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
    stats: { hp: 1120, atk: 88, def: 95, spd: 66, crit: 5, critRate: 10 },
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
    stats: { hp: 680, atk: 124, def: 48, spd: 98, crit: 10, critRate: 15 },
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
    stats: { hp: 640, atk: 130, def: 42, spd: 108, crit: 20, critRate: 15 },
    skill: {
      name: 'แทงจุดตาย', mp: 3, desc: 'โจมตีเดี่ยว 160% แรงขึ้นเท่าตัวถ้าเป้าหมายสตันอยู่',
      effects: [{ kind: 'damage', mult: 1.6, target: 'one', bonusOn: 'stun', bonusMult: 2 }],
    },
    ultimate: {
      name: 'เงาทาบสามครั้ง', desc: 'โจมตีเดี่ยว 350%',
      effects: [{ kind: 'damage', mult: 3.5, target: 'one' }],
    },
    blurb: 'ความแรงคริสูงสุดในระดับ R ติดคริทีดาเมจพุ่งกว่าใคร เข้าคู่ได้ดีกับตัวที่ทำสตัน',
  },

  // ───────── ระดับ SR เพิ่มเติม ─────────
  zephyr: {
    id: 'zephyr', name: 'เซเฟียร์', epithet: 'จอมเวทพายุ',
    rarity: 'SR', element: 'wind', role: 'mystic',
    stats: { hp: 880, atk: 142, def: 58, spd: 96, crit: 10, critRate: 10 },
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
    stats: { hp: 1320, atk: 102, def: 112, spd: 78, crit: 6, critRate: 10 },
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
    stats: { hp: 790, atk: 172, def: 52, spd: 102, crit: 18, critRate: 15 },
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
    stats: { hp: 1150, atk: 148, def: 88, spd: 100, crit: 12, critRate: 10 },
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
    stats: { hp: 1080, atk: 215, def: 76, spd: 98, crit: 20, critRate: 15 },
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
    stats: { hp: 1560, atk: 158, def: 128, spd: 86, crit: 10, critRate: 10 },
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

  // ───────── ตัวละครชุดใหม่ · ระดับ SR ─────────
  // แต่ละตัวมีสนามที่ถนัด บอกไว้ในฟิลด์ focus
  // เพื่อให้ผู้เล่นเลือกได้ว่าจะปั้นใครก่อนตามสิ่งที่กำลังติดอยู่
  gaius: {
    id: 'gaius', name: 'ไกอัส', epithet: 'ผู้พิทักษ์หินผา',
    rarity: 'SR', element: 'earth', role: 'guardian', focus: 'farm',
    stats: { hp: 1450, atk: 108, def: 118, spd: 74, crit: 5, critRate: 10 },
    skill: {
      name: 'ปราการหิน', mp: 3,
      desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และฟื้นพลังตัวเอง 20%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'heal', percent: 0.2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ผาถล่มทับ', desc: 'โจมตีศัตรูทุกตัว 180% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 1.8, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    blurb: 'ตัวยืนที่ดูแลตัวเองได้ เหมาะกับการไล่เก็บด่านยาว ๆ โดยไม่ต้องพึ่งหมอ',
  },
  celine: {
    id: 'celine', name: 'เซลีน', epithet: 'นักบวชสายธาร',
    rarity: 'SR', element: 'water', role: 'mystic', focus: 'farm',
    stats: { hp: 980, atk: 126, def: 72, spd: 94, crit: 8, critRate: 10 },
    skill: {
      name: 'สายธารชโลม', mp: 3,
      desc: 'ฟื้นพลังทั้งทีม 18% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'คลื่นซัดฝั่ง', desc: 'โจมตีศัตรูทุกตัว 230% และฟื้นพลังทั้งทีม 20%',
      effects: [
        { kind: 'damage', mult: 2.3, target: 'allFoes' },
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
      ],
    },
    blurb: 'ฟื้นทั้งทีมได้ตั้งแต่สกิล ทำให้ไล่เก็บหลายด่านติดกันโดยไม่ต้องหยุดพัก',
  },
  ryusei: {
    id: 'ryusei', name: 'ริวเซ', epithet: 'ดาบลมกรด',
    rarity: 'SR', element: 'wind', role: 'striker', focus: 'farm',
    stats: { hp: 820, atk: 158, def: 56, spd: 116, crit: 16, critRate: 15 },
    skill: {
      name: 'ฟันกวาดลม', mp: 3, desc: 'โจมตีศัตรูทุกตัว 135%',
      effects: [{ kind: 'damage', mult: 1.35, target: 'allFoes' }],
    },
    ultimate: {
      name: 'พายุใบมีด', desc: 'โจมตีศัตรูทุกตัว 300%',
      effects: [{ kind: 'damage', mult: 3, target: 'allFoes' }],
    },
    blurb: 'เร็วและกวาดทั้งแถว จบด่านที่มีศัตรูสามตัวได้ในไม่กี่เทิร์น',
  },
  talon: {
    id: 'talon', name: 'ทาลอน', epithet: 'นักล่าเปลวไฟ',
    rarity: 'SR', element: 'fire', role: 'striker', focus: 'farm',
    stats: { hp: 860, atk: 164, def: 58, spd: 100, crit: 14, critRate: 15 },
    skill: {
      name: 'เพลิงลาม', mp: 3, desc: 'โจมตีศัตรูทุกตัว 125% และทำให้ติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.25, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
    ultimate: {
      name: 'ทะเลเพลิง', desc: 'โจมตีศัตรูทุกตัว 260% แรงขึ้นครึ่งหนึ่งกับตัวที่ติดไฟ',
      effects: [{ kind: 'damage', mult: 2.6, target: 'allFoes', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'ติดไฟให้ทั้งแถวแล้วเก็บทีเดียว คุ้มที่สุดเมื่อศัตรูมาหลายตัว',
  },
  mira: {
    id: 'mira', name: 'มิรา', epithet: 'ผู้ถือคบเพลิงแสง',
    rarity: 'SR', element: 'light', role: 'mystic', focus: 'farm',
    stats: { hp: 1020, atk: 104, def: 80, spd: 92, crit: 6, critRate: 10 },
    skill: {
      name: 'แสงประคอง', mp: 3,
      desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 35% และให้เกราะ',
      effects: [
        { kind: 'heal', percent: 0.35, target: 'lowestAlly' },
        { kind: 'status', status: 'shield', turns: 1, target: 'lowestAlly' },
      ],
    },
    ultimate: {
      name: 'วงแสงคุ้มครอง', desc: 'ฟื้นพลังทั้งทีม 30% ให้เกราะทั้งทีม และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.3, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'หมอที่แข็งแรงกว่าลูมินา เหมาะกับทีมที่ต้องยืนระยะยาว',
  },
  kage: {
    id: 'kage', name: 'คาเงะ', epithet: 'เงาไร้เสียง',
    rarity: 'SR', element: 'dark', role: 'striker', focus: 'pvp',
    stats: { hp: 780, atk: 182, def: 50, spd: 124, crit: 24, critRate: 15 },
    skill: {
      name: 'ลอบสังหาร', mp: 3, desc: 'โจมตีเดี่ยว 210% แรงขึ้นเท่าตัวถ้าเป้าหมายสตัน',
      effects: [{ kind: 'damage', mult: 2.1, target: 'one', bonusOn: 'stun', bonusMult: 2 }],
    },
    ultimate: {
      name: 'ตัดสินในพริบตา', desc: 'โจมตีเดี่ยว 480%',
      effects: [{ kind: 'damage', mult: 4.8, target: 'one' }],
    },
    blurb: 'เร็วที่สุดในระดับ SR ได้ลงมือก่อนแล้วเก็บหมอของฝ่ายตรงข้ามทันที',
  },
  vesper: {
    id: 'vesper', name: 'เวสเปอร์', epithet: 'ผู้กุมสายลม',
    rarity: 'SR', element: 'wind', role: 'guardian', focus: 'pvp',
    stats: { hp: 1280, atk: 118, def: 104, spd: 98, crit: 8, critRate: 10 },
    skill: {
      name: 'ลมสะกด', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และมีโอกาสครึ่งหนึ่งทำให้ศัตรูสตัน',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    ultimate: {
      name: 'สุญญากาศ', desc: 'โจมตีศัตรูทุกตัว 200% และสตันทุกตัว 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
      ],
    },
    blurb: 'ตัวคุมจังหวะ สตันทั้งแถวได้ ทำให้ฝ่ายตรงข้ามเสียเทิร์นทั้งทีม',
  },
  borga: {
    id: 'borga', name: 'บอร์กา', epithet: 'ค้อนทำลายภูผา',
    rarity: 'SR', element: 'earth', role: 'striker', focus: 'boss',
    stats: { hp: 1080, atk: 176, def: 78, spd: 68, crit: 12, critRate: 15 },
    skill: {
      name: 'ทุบซ้ำจุดเดิม', mp: 3, desc: 'โจมตีเดี่ยว 240%',
      effects: [{ kind: 'damage', mult: 2.4, target: 'one' }],
    },
    ultimate: {
      name: 'ค้อนสุดท้าย', desc: 'โจมตีเดี่ยว 560%',
      effects: [{ kind: 'damage', mult: 5.6, target: 'one' }],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงที่สุดในระดับ SR สร้างมาเพื่อตีบอสโดยเฉพาะ',
  },

  // ───────── ตัวละครชุดใหม่ · ระดับ SSR ─────────
  helios: {
    id: 'helios', name: 'เฮลิออส', epithet: 'อาทิตย์เที่ยงวัน',
    rarity: 'SSR', element: 'light', role: 'mystic', focus: 'farm',
    stats: { hp: 1240, atk: 168, def: 92, spd: 102, crit: 14, critRate: 10 },
    skill: {
      name: 'ลำแสงเผาผลาญ', mp: 3, desc: 'โจมตีศัตรูทุกตัว 165% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 1.65, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'สุริยะเที่ยงตรง',
      desc: 'โจมตีศัตรูทุกตัว 330% ฟื้นพลังทั้งทีม 30% และล้างสถานะติดลบ',
      effects: [
        { kind: 'damage', mult: 3.3, target: 'allFoes' },
        { kind: 'heal', percent: 0.3, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'กวาดและฟื้นในท่าเดียว ทีมที่มีตัวนี้แทบไม่ต้องมีหมออีกตัว',
  },
  frostina: {
    id: 'frostina', name: 'ฟรอสตินา', epithet: 'ราชินีเหมันต์',
    rarity: 'SSR', element: 'water', role: 'striker', focus: 'farm',
    stats: { hp: 1120, atk: 198, def: 84, spd: 108, crit: 16, critRate: 15 },
    skill: {
      name: 'พันธนาการน้ำแข็ง', mp: 3,
      desc: 'โจมตีศัตรูทุกตัว 155% และมีโอกาสหนึ่งในสามทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 1.55, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.33 },
      ],
    },
    ultimate: {
      name: 'เหมันต์นิรันดร์', desc: 'โจมตีศัตรูทุกตัว 360% และสตันทุกตัว 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 3.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
      ],
    },
    blurb: 'กวาดแรงและหยุดศัตรูไปพร้อมกัน ทำให้ด่านที่ศัตรูเยอะกลายเป็นเรื่องง่าย',
  },
  nocturne: {
    id: 'nocturne', name: 'น็อกเทิร์น', epithet: 'บทเพลงแห่งราตรี',
    rarity: 'SSR', element: 'dark', role: 'striker', focus: 'pvp',
    stats: { hp: 1040, atk: 232, def: 78, spd: 126, crit: 26, critRate: 15 },
    skill: {
      name: 'ท่วงทำนองสุดท้าย', mp: 3, desc: 'โจมตีเดี่ยว 260% และทำให้เป้าหมายสตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.6 },
      ],
    },
    ultimate: {
      name: 'ราตรีปิดฉาก', desc: 'โจมตีเดี่ยว 620% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายสตัน',
      effects: [{ kind: 'damage', mult: 6.2, target: 'one', bonusOn: 'stun', bonusMult: 1.5 }],
    },
    blurb: 'เร็วที่สุดในเกมและตีแรงที่สุดต่อเป้าหมายเดียว ออกแบบมาเพื่อสนามประลอง',
  },
  titanor: {
    id: 'titanor', name: 'ไททานอร์', epithet: 'ป้อมปราการมีชีวิต',
    rarity: 'SSR', element: 'earth', role: 'guardian', focus: 'boss',
    stats: { hp: 1820, atk: 176, def: 148, spd: 80, crit: 10, critRate: 10 },
    skill: {
      name: 'กำแพงไม่แตกสลาย', mp: 3,
      desc: 'ดึงเป้าโจมตี 3 เทิร์น เพิ่มป้องกัน และได้เกราะ',
      effects: [
        { kind: 'status', status: 'taunt', turns: 3, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ทุบด้วยน้ำหนักทั้งตัว', desc: 'โจมตีเดี่ยว 520% และฟื้นพลังตัวเอง 25%',
      effects: [
        { kind: 'damage', mult: 5.2, target: 'one' },
        { kind: 'heal', percent: 0.25, target: 'self' },
      ],
    },
    blurb: 'ยืนรับบอสได้นานที่สุดและยังตีแรง เหมาะกับการตีบอสโลกที่ยาวสามสิบรอบ',
  },
  etheria: {
    id: 'etheria', name: 'เอเธเรีย', epithet: 'ผู้ทอสายธารกาล',
    rarity: 'SSR', element: 'light', role: 'mystic', focus: 'all',
    stats: { hp: 1300, atk: 186, def: 96, spd: 112, crit: 15, critRate: 10 },
    skill: {
      name: 'ย้อนสายธาร', mp: 3,
      desc: 'ฟื้นพลังทั้งทีม 25% ให้เกราะทั้งทีม และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'กาลเวลาพังทลาย',
      desc: 'โจมตีศัตรูทุกตัว 340% สตันทุกตัว 1 เทิร์น และฟื้นพลังทั้งทีม 25%',
      effects: [
        { kind: 'damage', mult: 3.4, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
      ],
    },
    blurb: 'ทำได้ทุกอย่างและใช้ได้ทุกสนาม ตัวที่แข็งแกร่งที่สุดในเกม',
  },
}

export const ALL_IDS = Object.keys(CHARACTERS)

export const STARTER_IDS = Object.values(CHARACTERS)
  .filter((c) => c.starter)
  .map((c) => c.id)

/**
 * ตู้กาชา
 *
 * แยกเป็นสองตู้เพราะถ้ารวมกัน ตัวที่เพิ่มใหม่จะถูกกลืนหายไปในกองเดิม
 * โอกาสได้ตัวที่ต้องการจริงจะต่ำลงทุกครั้งที่เพิ่มตัวละคร ซึ่งกลับด้านกับที่ควรเป็น
 */
export const BANNERS = [
  {
    id: 'origin',
    name: 'ตู้เริ่มต้น',
    desc: 'ตัวละครชุดแรกของเกม รวมสามตัวเริ่มต้นและตัวหายากรุ่นบุกเบิก',
    ids: [
      'athen', 'galen', 'lumina', 'bren', 'moss', 'torg', 'neria', 'corvin',
      'zephyr', 'iris', 'velka', 'solaris', 'drakos', 'umbra',
    ],
  },
  {
    id: 'vanguard',
    name: 'ตู้ทัพหน้าใหม่',
    desc: 'ตัวละครรุ่นใหม่ที่แยกสนามถนัดชัดเจน ทั้งไล่เก็บด่าน ประลอง และตีบอส',
    ids: [
      'gaius', 'celine', 'ryusei', 'talon', 'mira', 'kage', 'vesper', 'borga',
      'helios', 'frostina', 'nocturne', 'titanor', 'etheria',
    ],
  },
]

export function bannerPool(bannerId) {
  const banner = BANNERS.find((b) => b.id === bannerId) ?? BANNERS[0]
  return RARITIES.reduce((acc, r) => {
    acc[r] = banner.ids.filter((id) => CHARACTERS[id]?.rarity === r)
    return acc
  }, {})
}

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
