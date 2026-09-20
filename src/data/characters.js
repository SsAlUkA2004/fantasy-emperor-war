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

  // ═════════ ตู้ธาตุหมุนเวียน (Elemental Gacha) ═════════
  // หกธาตุ ธาตุละสิบตัว (R 3 · SR 3 · SSR 4) รวมหกสิบตัว
  // แต่ละธาตุมีครบสามบทบาทตั้งแต่ระดับ R/SR ส่วน SSR เพิ่มสายโจมตีอีกหนึ่งตัว
  // ให้ทุกธาตุมีสัดส่วนบทบาทเท่ากันเป๊ะ (โจมตี 4 · ป้องกัน 3 · สนับสนุน 3 ต่อธาตุ)
  // ตู้นี้ไม่ได้อยู่ในออบเจ็กต์ BANNERS ปกติ เพราะสลับกลุ่มที่เปิดทุกชั่วโมง
  // ดูตรรกะหมุนเวียนที่ data/elemental.js และการสุ่มที่ lib/elementalgacha.js
  // ─────────── เพลิง ───────────
  ignar: {
    id: 'ignar', name: 'อิกนาร์', epithet: 'นักดาบเปลวรุ่นใหม่',
    rarity: 'R', element: 'fire', role: 'striker', focus: 'farm',
    stats: { hp: 650, atk: 128, def: 44, spd: 108, crit: 16, critRate: 15 },
    skill: {
      name: 'ฟันเพลิงตรง', mp: 3, desc: 'โจมตีเดี่ยว 160% และทำให้เป้าหมายติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.6, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
    ultimate: {
      name: 'เพลิงทะลวง', desc: 'โจมตีเดี่ยว 320% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายติดไฟอยู่',
      effects: [{ kind: 'damage', mult: 3.2, target: 'one', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'ตัวเริ่มต้นสายเพลิงที่ตรงไปตรงมา จุดไฟแล้วเก็บจบในท่าเดียว',
  },
  cindra: {
    id: 'cindra', name: 'ซินดรา', epithet: 'โล่ธุลีเพลิง',
    rarity: 'R', element: 'fire', role: 'guardian', focus: 'pvp',
    stats: { hp: 1080, atk: 90, def: 92, spd: 68, crit: 6, critRate: 10 },
    skill: {
      name: 'กำแพงเถ้าถ่าน', mp: 3, desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ระเบิดเถ้าภูเขาไฟ', desc: 'โจมตีศัตรูทุกตัว 140% และทำให้ติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.4, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
    blurb: 'ยืนบังแล้วยังทิ้งไฟเผาไว้ให้ทีมเก็บต่อ',
  },
  ashwen: {
    id: 'ashwen', name: 'แอชเวน', epithet: 'หมอเถ้าไฟ',
    rarity: 'R', element: 'fire', role: 'mystic', focus: 'boss',
    stats: { hp: 780, atk: 76, def: 62, spd: 90, crit: 6, critRate: 10 },
    skill: {
      name: 'ผงเถ้ารักษา', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 25%',
      effects: [{ kind: 'heal', percent: 0.25, target: 'lowestAlly' }],
    },
    ultimate: {
      name: 'ไอเถ้าชโลมทีม', desc: 'ฟื้นพลังทั้งทีม 18% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'หมอราคาถูกสายเพลิง ฟื้นได้เรื่อย ๆ ระหว่างที่ทีมจุดไฟใส่ศัตรู',
  },
  pyrona: {
    id: 'pyrona', name: 'ไพโรนา', epithet: 'ดาบเปลวกลางวัน',
    rarity: 'SR', element: 'fire', role: 'striker', focus: 'all',
    stats: { hp: 850, atk: 172, def: 58, spd: 112, crit: 18, critRate: 15 },
    skill: {
      name: 'เปลวกวาดแถว', mp: 3, desc: 'โจมตีศัตรูทุกตัว 125% และทำให้ติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.25, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
    ultimate: {
      name: 'ทะเลเพลิงเที่ยงวัน', desc: 'โจมตีศัตรูทุกตัว 260% แรงขึ้นครึ่งหนึ่งกับตัวที่ติดไฟ',
      effects: [{ kind: 'damage', mult: 2.6, target: 'allFoes', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'จุดไฟทั้งแถวแล้วเก็บทีเดียว คุ้มมากเมื่อเจอศัตรูหลายตัว',
  },
  brandt: {
    id: 'brandt', name: 'แบรนต์', epithet: 'ป้อมปราการลาวา',
    rarity: 'SR', element: 'fire', role: 'guardian', focus: 'farm',
    stats: { hp: 1350, atk: 112, def: 112, spd: 82, crit: 6, critRate: 10 },
    skill: {
      name: 'เกราะลาวาไหล', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ลาวาถล่มทั่วสนาม', desc: 'โจมตีศัตรูทุกตัว 200% และทำให้ติดไฟ 3 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.0, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
    blurb: 'ตัวถังที่ยังทิ้งไฟไหม้ยาวสามเทิร์นไว้ให้หลังจากดึงเป้าจบ',
  },
  sunfira: {
    id: 'sunfira', name: 'ซันไฟรา', epithet: 'ผู้เสกไฟสุริยะ',
    rarity: 'SR', element: 'fire', role: 'mystic', focus: 'pvp',
    stats: { hp: 950, atk: 118, def: 64, spd: 94, crit: 8, critRate: 10 },
    skill: {
      name: 'แสงเพลิงชุบชีวิต', mp: 3, desc: 'ฟื้นพลังทั้งทีม 18% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'สุริยะเผาผลาญ', desc: 'โจมตีศัตรูทุกตัว 230% และฟื้นพลังทั้งทีม 20%',
      effects: [
        { kind: 'damage', mult: 2.3, target: 'allFoes' },
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
      ],
    },
    blurb: 'หมอที่ตีแรงได้ด้วย ไม้ตายกวาดศัตรูพร้อมฟื้นทีมในท่าเดียว',
  },
  vulkar: {
    id: 'vulkar', name: 'วัลคาร์', epithet: 'จอมพลังภูเขาไฟ',
    rarity: 'SSR', element: 'fire', role: 'striker', focus: 'boss',
    stats: { hp: 1080, atk: 212, def: 80, spd: 108, crit: 20, critRate: 15 },
    skill: {
      name: 'ลมหายใจลาวา', mp: 3, desc: 'โจมตีศัตรูทุกตัว 150% และทำให้ติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
    ultimate: {
      name: 'ปะทุสิ้นภพ', desc: 'โจมตีเดี่ยว 500% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายติดไฟอยู่',
      effects: [{ kind: 'damage', mult: 5.0, target: 'one', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'จุดไฟทั้งสนามด้วยสกิลแล้วจบทีละตัวด้วยไม้ตายที่แรงขึ้นจากไฟนั้น',
  },
  ignatia: {
    id: 'ignatia', name: 'อิกนาเทีย', epithet: 'เปลวมฤตยู',
    rarity: 'SSR', element: 'fire', role: 'striker', focus: 'all',
    stats: { hp: 1000, atk: 222, def: 72, spd: 118, crit: 24, critRate: 15 },
    skill: {
      name: 'จุดชนวนมรณะ', mp: 3, desc: 'โจมตีเดี่ยว 190% และทำให้ติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.9, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
    ultimate: {
      name: 'เพลิงมฤตยูเผาผลาญ', desc: 'โจมตีเดี่ยว 550% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายติดไฟอยู่',
      effects: [{ kind: 'damage', mult: 5.5, target: 'one', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงสุดของสายเพลิง ใช้จัดการตัวอันตรายที่สุดก่อน',
  },
  magnor: {
    id: 'magnor', name: 'แมกนอร์', epithet: 'ยักษ์เกราะเหล็กเพลิง',
    rarity: 'SSR', element: 'fire', role: 'guardian', focus: 'farm',
    stats: { hp: 1650, atk: 168, def: 134, spd: 84, crit: 12, critRate: 10 },
    skill: {
      name: 'เกราะเหล็กหลอมลาวา', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'คลื่นเพลิงถล่มทัพ', desc: 'โจมตีศัตรูทุกตัว 220% และทำให้ติดไฟ 3 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.2, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
    blurb: 'ตัวถังที่ตีแรงพอตัว ยืนรับแล้วยังจุดไฟถล่มทั้งแถวได้',
  },
  emberia: {
    id: 'emberia', name: 'เอมเบอเรีย', epithet: 'เทพีถ่านไฟ',
    rarity: 'SSR', element: 'fire', role: 'mystic', focus: 'pvp',
    stats: { hp: 1200, atk: 172, def: 90, spd: 106, crit: 14, critRate: 10 },
    skill: {
      name: 'ลำแสงถ่านร้อน', mp: 3, desc: 'โจมตีศัตรูทุกตัว 150% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'เถ้าไฟชุบชีวิต', desc: 'โจมตีศัตรูทุกตัว 300% ฟื้นพลังทั้งทีม 25% และล้างสถานะติดลบ',
      effects: [
        { kind: 'damage', mult: 3.0, target: 'allFoes' },
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'กวาดและฟื้นในตัวเดียว ทีมที่มีตัวนี้ไล่เก็บด่านยาว ๆ ได้สบาย',
  },

  // ─────────── วารี ───────────
  riplen: {
    id: 'riplen', name: 'ริปเลน', epithet: 'ดาบคลื่นซัด',
    rarity: 'R', element: 'water', role: 'striker', focus: 'farm',
    stats: { hp: 660, atk: 120, def: 46, spd: 104, crit: 12, critRate: 15 },
    skill: {
      name: 'ฟันคลื่นเดี่ยว', mp: 3, desc: 'โจมตีเดี่ยว 165%',
      effects: [{ kind: 'damage', mult: 1.65, target: 'one' }],
    },
    ultimate: {
      name: 'คลื่นซัดสลาย', desc: 'โจมตีเดี่ยว 320% และล้างสถานะติดลบของตัวเอง',
      effects: [
        { kind: 'damage', mult: 3.2, target: 'one' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    blurb: 'ตัวเลือกเริ่มต้นสายน้ำ ล้างสถานะตัวเองได้ทุกครั้งที่ปล่อยไม้ตาย',
  },
  torrek: {
    id: 'torrek', name: 'ทอร์เรก', epithet: 'อัศวินโล่สมุทร',
    rarity: 'R', element: 'water', role: 'guardian', focus: 'pvp',
    stats: { hp: 1120, atk: 84, def: 98, spd: 62, crit: 5, critRate: 10 },
    skill: {
      name: 'โล่คลื่นกำบัง', mp: 3, desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'กระแสน้ำวนป้องกัน', desc: 'โจมตีศัตรูทุกตัว 130% และล้างสถานะติดลบของตัวเอง',
      effects: [
        { kind: 'damage', mult: 1.3, target: 'allFoes' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    blurb: 'ตัวถังที่ล้างสถานะติดลบตัวเองได้เรื่อย ๆ ทนกว่าที่ตัวเลขบอก',
  },
  aqualin: {
    id: 'aqualin', name: 'อควาลิน', epithet: 'นักบวชสายฝน',
    rarity: 'R', element: 'water', role: 'mystic', focus: 'boss',
    stats: { hp: 820, atk: 70, def: 68, spd: 84, crit: 5, critRate: 10 },
    skill: {
      name: 'สายฝนชโลม', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 28% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.28, target: 'lowestAlly' },
        { kind: 'cleanse', target: 'lowestAlly' },
      ],
    },
    ultimate: {
      name: 'ห่าฝนบำบัด', desc: 'ฟื้นพลังทั้งทีม 20%',
      effects: [{ kind: 'heal', percent: 0.2, target: 'allAllies' }],
    },
    blurb: 'ฟื้นพร้อมล้างสถานะในท่าเดียว หมอมือใหม่ที่ใช้ง่ายที่สุด',
  },
  marintha: {
    id: 'marintha', name: 'มารินธา', epithet: 'ดาบสาหร่ายมรกต',
    rarity: 'SR', element: 'water', role: 'striker', focus: 'all',
    stats: { hp: 900, atk: 162, def: 64, spd: 108, crit: 14, critRate: 15 },
    skill: {
      name: 'ฟันวังวน', mp: 3, desc: 'โจมตีเดี่ยว 175%',
      effects: [{ kind: 'damage', mult: 1.75, target: 'one' }],
    },
    ultimate: {
      name: 'สมุทรกลืนกิน', desc: 'โจมตีเดี่ยว 340% และล้างสถานะติดลบของตัวเอง',
      effects: [
        { kind: 'damage', mult: 3.4, target: 'one' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงกว่าริปเลนอีกขั้น เหมาะกับด่านบอสเดี่ยว',
  },
  coralun: {
    id: 'coralun', name: 'คอรัลลุน', epithet: 'ปราการปะการัง',
    rarity: 'SR', element: 'water', role: 'guardian', focus: 'farm',
    stats: { hp: 1420, atk: 104, def: 118, spd: 76, crit: 5, critRate: 10 },
    skill: {
      name: 'กำแพงปะการัง', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'แนวปะการังคุ้มภัย', desc: 'ให้เกราะทั้งทีม และเพิ่มป้องกันตัวเอง 3 เทิร์น',
      effects: [
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
      ],
    },
    blurb: 'แจกเกราะทั้งทีมได้เหมือนอีริส ทนมากในด่านที่ต้องยืนระยะยาว',
  },
  brinelle: {
    id: 'brinelle', name: 'บรีเนลล์', epithet: 'นักบวชไอทะเล',
    rarity: 'SR', element: 'water', role: 'mystic', focus: 'pvp',
    stats: { hp: 1000, atk: 96, def: 72, spd: 90, crit: 6, critRate: 10 },
    skill: {
      name: 'ไอทะเลชโลม', mp: 3, desc: 'ฟื้นพลังทั้งทีม 18% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'คลื่นซัดฝั่งชุบชีวิต', desc: 'โจมตีศัตรูทุกตัว 220% และฟื้นพลังทั้งทีม 18%',
      effects: [
        { kind: 'damage', mult: 2.2, target: 'allFoes' },
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
      ],
    },
    blurb: 'หมอที่กวาดดาเมจได้ด้วย ไล่เก็บด่านต่อเนื่องโดยไม่ต้องพัก',
  },
  tsunar: {
    id: 'tsunar', name: 'ซึนาร์', epithet: 'จอมคลื่นยักษ์',
    rarity: 'SSR', element: 'water', role: 'striker', focus: 'boss',
    stats: { hp: 1100, atk: 204, def: 82, spd: 104, crit: 18, critRate: 15 },
    skill: {
      name: 'คลื่นยักษ์ถล่ม', desc: 'โจมตีศัตรูทุกตัว 155% และล้างสถานะติดลบของตัวเอง', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.55, target: 'allFoes' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    ultimate: {
      name: 'สึนามิล้างสนาม', desc: 'โจมตีเดี่ยว 460% และล้างสถานะติดลบของตัวเอง',
      effects: [
        { kind: 'damage', mult: 4.6, target: 'one' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    blurb: 'กวาดแถวด้วยสกิลแล้วจบเป้าหมายเดียวแรง ๆ ด้วยไม้ตาย',
  },
  naiadel: {
    id: 'naiadel', name: 'ไนอาเดล', epithet: 'นางไม้แห่งท้องน้ำ',
    rarity: 'SSR', element: 'water', role: 'striker', focus: 'all',
    stats: { hp: 1060, atk: 210, def: 78, spd: 110, crit: 20, critRate: 15 },
    skill: {
      name: 'สายธารเจาะทะลุ', mp: 3, desc: 'โจมตีเดี่ยว 185%',
      effects: [{ kind: 'damage', mult: 1.85, target: 'one' }],
    },
    ultimate: {
      name: 'ห้วงมหาสมุทร', desc: 'โจมตีเดี่ยว 500% และล้างสถานะติดลบของตัวเอง',
      effects: [
        { kind: 'damage', mult: 5.0, target: 'one' },
        { kind: 'cleanse', target: 'self' },
      ],
    },
    blurb: 'ดาเมจต่อตัวสูงสุดของสายน้ำ เรียบง่ายแต่แรงตรงจุด',
  },
  leviara: {
    id: 'leviara', name: 'เลวีอารา', epithet: 'ราชินีใต้สมุทร',
    rarity: 'SSR', element: 'water', role: 'guardian', focus: 'farm',
    stats: { hp: 1750, atk: 160, def: 142, spd: 80, crit: 10, critRate: 10 },
    skill: {
      name: 'ราชันย์แห่งท้องทะเล', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น ได้เกราะ และฟื้นพลังตัวเอง 15%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
        { kind: 'heal', percent: 0.15, target: 'self' },
      ],
    },
    ultimate: {
      name: 'คลื่นบัลลังก์สมุทร', desc: 'โจมตีศัตรูทุกตัว 200% และฟื้นพลังทั้งทีม 20%',
      effects: [
        { kind: 'damage', mult: 2.0, target: 'allFoes' },
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
      ],
    },
    blurb: 'ตัวถังที่ดูแลตัวเองและทีมได้พร้อมกัน เหมาะกับด่านยาวที่ไม่มีหมอ',
  },
  aquessa: {
    id: 'aquessa', name: 'อควีสซา', epithet: 'เทพีสายน้ำนิรันดร์',
    rarity: 'SSR', element: 'water', role: 'mystic', focus: 'pvp',
    stats: { hp: 1280, atk: 156, def: 94, spd: 102, crit: 12, critRate: 10 },
    skill: {
      name: 'สายน้ำนิรันดร์', mp: 3, desc: 'ฟื้นพลังทั้งทีม 20% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'สมุทรไร้ที่สิ้นสุด', desc: 'โจมตีศัตรูทุกตัว 280% และฟื้นพลังทั้งทีม 25%',
      effects: [
        { kind: 'damage', mult: 2.8, target: 'allFoes' },
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
      ],
    },
    blurb: 'หมอเต็มตัวของสายน้ำ ฟื้นหนักและกวาดแรงในท่าเดียว',
  },

  // ─────────── พายุ ───────────
  gustan: {
    id: 'gustan', name: 'กัสตัน', epithet: 'ดาบลมกรรโชก',
    rarity: 'R', element: 'wind', role: 'striker', focus: 'farm',
    stats: { hp: 610, atk: 122, def: 40, spd: 118, crit: 14, critRate: 15 },
    skill: {
      name: 'ใบมีดลมอ่อน', mp: 3, desc: 'โจมตีศัตรูทุกตัว 115%',
      effects: [{ kind: 'damage', mult: 1.15, target: 'allFoes' }],
    },
    ultimate: {
      name: 'พายุใบไม้ร่วง', desc: 'โจมตีศัตรูทุกตัว 240%',
      effects: [{ kind: 'damage', mult: 2.4, target: 'allFoes' }],
    },
    blurb: 'เร็วที่สุดในบรรดาตัว R ทั้งหมด ได้ลงมือก่อนเกือบทุกครั้ง',
  },
  aerdon: {
    id: 'aerdon', name: 'แอร์ดอน', epithet: 'ผู้พิทักษ์กระแสลม',
    rarity: 'R', element: 'wind', role: 'guardian', focus: 'pvp',
    stats: { hp: 1050, atk: 88, def: 86, spd: 72, crit: 7, critRate: 10 },
    skill: {
      name: 'ม่านลมกำบัง', mp: 3, desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น',
      effects: [{ kind: 'status', status: 'taunt', turns: 2, target: 'self' }],
    },
    ultimate: {
      name: 'ลมหมุนสะกดจิต', desc: 'โจมตีศัตรูทุกตัว 140% และมีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.4, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    blurb: 'ดึงเป้าแล้วยังคุมจังหวะทั้งแถวด้วยไม้ตายสตัน',
  },
  breezel: {
    id: 'breezel', name: 'บรีเซล', epithet: 'นักบวชสายลมอ่อน',
    rarity: 'R', element: 'wind', role: 'mystic', focus: 'boss',
    stats: { hp: 760, atk: 74, def: 60, spd: 96, crit: 7, critRate: 10 },
    skill: {
      name: 'สายลมชโลม', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 25%',
      effects: [{ kind: 'heal', percent: 0.25, target: 'lowestAlly' }],
    },
    ultimate: {
      name: 'พายุพัดหมุนเวียน', desc: 'โจมตีศัตรูทุกตัว 100% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 1.0, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    blurb: 'หมอที่ตีแถวได้เล็กน้อยด้วย เก็บด่านที่ศัตรูเยอะได้เร็วกว่าหมอทั่วไป',
  },
  cyclona: {
    id: 'cyclona', name: 'ไซโคลนา', epithet: 'ดาบพายุหมุน',
    rarity: 'SR', element: 'wind', role: 'striker', focus: 'all',
    stats: { hp: 800, atk: 168, def: 54, spd: 122, crit: 16, critRate: 15 },
    skill: {
      name: 'ฟันกวาดพายุ', mp: 3, desc: 'โจมตีศัตรูทุกตัว 130%',
      effects: [{ kind: 'damage', mult: 1.3, target: 'allFoes' }],
    },
    ultimate: {
      name: 'วงแหวนพายุหมุน', desc: 'โจมตีศัตรูทุกตัว 290%',
      effects: [{ kind: 'damage', mult: 2.9, target: 'allFoes' }],
    },
    blurb: 'เร็วและกวาดทั้งแถว จบด่านที่มีศัตรูหลายตัวได้ในไม่กี่เทิร์น',
  },
  tempes: {
    id: 'tempes', name: 'เทมเปส', epithet: 'อัศวินพายุ',
    rarity: 'SR', element: 'wind', role: 'guardian', focus: 'farm',
    stats: { hp: 1300, atk: 108, def: 106, spd: 94, crit: 7, critRate: 10 },
    skill: {
      name: 'สนามพายุคุม', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และมีโอกาสครึ่งหนึ่งทำให้ศัตรูสตัน',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    ultimate: {
      name: 'ตาพายุสงบนิ่ง', desc: 'โจมตีศัตรูทุกตัว 190% และสตันทุกตัว 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.9, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
      ],
    },
    blurb: 'คุมจังหวะได้เหมือนเวสเปอร์ สตันทั้งแถวทำให้ฝ่ายตรงข้ามเสียเทิร์น',
  },
  windra: {
    id: 'windra', name: 'วินดรา', epithet: 'นักบวชแห่งเวหา',
    rarity: 'SR', element: 'wind', role: 'mystic', focus: 'pvp',
    stats: { hp: 900, atk: 108, def: 60, spd: 96, crit: 9, critRate: 10 },
    skill: {
      name: 'ผงคว้างเวหา', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 35% และให้เกราะ',
      effects: [
        { kind: 'heal', percent: 0.35, target: 'lowestAlly' },
        { kind: 'status', status: 'shield', turns: 1, target: 'lowestAlly' },
      ],
    },
    ultimate: {
      name: 'วงลมคุ้มครอง', desc: 'ฟื้นพลังทั้งทีม 30% ให้เกราะทั้งทีม และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.3, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'หมอแข็งแรงสายเดียวกับมิรา เหมาะกับทีมที่ต้องยืนระยะยาว',
  },
  galehart: {
    id: 'galehart', name: 'เกลฮาร์ต', epithet: 'จอมพายุใบมีด',
    rarity: 'SSR', element: 'wind', role: 'striker', focus: 'boss',
    stats: { hp: 1050, atk: 208, def: 78, spd: 122, crit: 20, critRate: 15 },
    skill: {
      name: 'ใบมีดพายุหมุน', mp: 3, desc: 'โจมตีศัตรูทุกตัว 140% และมีโอกาสสามในสิบทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 1.4, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
    ultimate: {
      name: 'พายุกลืนฟ้าดิน', desc: 'โจมตีศัตรูทุกตัว 340% และสตันทุกตัว 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 3.4, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
      ],
    },
    blurb: 'กวาดแรงและหยุดศัตรูพร้อมกัน ด่านที่ศัตรูเยอะกลายเป็นเรื่องง่าย',
  },
  stormyx: {
    id: 'stormyx', name: 'สตอร์มิกซ์', epithet: 'สายฟ้าไร้เงา',
    rarity: 'SSR', element: 'wind', role: 'striker', focus: 'all',
    stats: { hp: 980, atk: 216, def: 70, spd: 130, crit: 22, critRate: 15 },
    skill: {
      name: 'สายฟ้าแยกร่าง', mp: 3, desc: 'โจมตีศัตรูทุกตัว 160%',
      effects: [{ kind: 'damage', mult: 1.6, target: 'allFoes' }],
    },
    ultimate: {
      name: 'พายุสายฟ้าล้างสนาม', desc: 'โจมตีศัตรูทุกตัว 360%',
      effects: [{ kind: 'damage', mult: 3.6, target: 'allFoes' }],
    },
    blurb: 'เร็วที่สุดในเกมเทียบเท่านอกเทิร์น กวาดแถวได้แรงและก่อนใคร',
  },
  aerielle: {
    id: 'aerielle', name: 'แอเรียล', epithet: 'ปราการเมฆา',
    rarity: 'SSR', element: 'wind', role: 'guardian', focus: 'farm',
    stats: { hp: 1600, atk: 166, def: 130, spd: 88, crit: 12, critRate: 10 },
    skill: {
      name: 'เมฆกำบังทั่วสนาม', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และมีโอกาสครึ่งหนึ่งทำให้ศัตรูสตัน',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    ultimate: {
      name: 'สุญญากาศเมฆา', desc: 'โจมตีศัตรูทุกตัว 220% และสตันทุกตัว 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.2, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
      ],
    },
    blurb: 'ตัวถังที่ทั้งดึงเป้าและสตันทั้งแถวได้ในตัวเดียว',
  },
  aerowyn: {
    id: 'aerowyn', name: 'แอโรวิน', epithet: 'เทพีแห่งสายลม',
    rarity: 'SSR', element: 'wind', role: 'mystic', focus: 'pvp',
    stats: { hp: 1180, atk: 164, def: 88, spd: 112, crit: 14, critRate: 10 },
    skill: {
      name: 'วงลมคุ้มครองทีม', mp: 3, desc: 'ฟื้นพลังทั้งทีม 18% และให้เกราะทั้งทีม',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'พายุเวหาคำราม', desc: 'โจมตีศัตรูทุกตัว 300% สตันทุกตัว 1 เทิร์น และฟื้นพลังทั้งทีม 20%',
      effects: [
        { kind: 'damage', mult: 3.0, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
      ],
    },
    blurb: 'ทำได้ทุกอย่างในตัวเดียวเหมือนเอเธเรีย แค่สายลมแทนสายแสง',
  },

  // ─────────── ปฐพี ───────────
  terrun: {
    id: 'terrun', name: 'เทอร์รัน', epithet: 'นักรบหินผา',
    rarity: 'R', element: 'earth', role: 'striker', focus: 'farm',
    stats: { hp: 700, atk: 116, def: 52, spd: 96, crit: 10, critRate: 15 },
    skill: {
      name: 'ทุบหินแรง', mp: 3, desc: 'โจมตีเดี่ยว 175%',
      effects: [{ kind: 'damage', mult: 1.75, target: 'one' }],
    },
    ultimate: {
      name: 'ค้อนศิลาถล่ม', desc: 'โจมตีเดี่ยว 340%',
      effects: [{ kind: 'damage', mult: 3.4, target: 'one' }],
    },
    blurb: 'ตีหนักตรงไปตรงมา ไม่มีลูกเล่นแต่วางใจได้ทุกด่าน',
  },
  boulden: {
    id: 'boulden', name: 'โบลเดน', epithet: 'ป้อมศิลาแข็งแกร่ง',
    rarity: 'R', element: 'earth', role: 'guardian', focus: 'pvp',
    stats: { hp: 1180, atk: 82, def: 105, spd: 58, crit: 5, critRate: 10 },
    skill: {
      name: 'กำแพงหินก้อนใหญ่', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และฟื้นพลังตัวเอง 15%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'heal', percent: 0.15, target: 'self' },
      ],
    },
    ultimate: {
      name: 'แผ่นดินไหวสะเทือน', desc: 'โจมตีศัตรูทุกตัว 130%',
      effects: [{ kind: 'damage', mult: 1.3, target: 'allFoes' }],
    },
    blurb: 'อึดที่สุดในบรรดาตัว R ฟื้นพลังตัวเองได้ทุกครั้งที่ตั้งการ์ด',
  },
  mossrik: {
    id: 'mossrik', name: 'มอสริก', epithet: 'หมอสมุนไพรป่าลึก',
    rarity: 'R', element: 'earth', role: 'mystic', focus: 'boss',
    stats: { hp: 850, atk: 68, def: 72, spd: 80, crit: 5, critRate: 10 },
    skill: {
      name: 'ยาพอกรากไม้', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 26%',
      effects: [{ kind: 'heal', percent: 0.26, target: 'lowestAlly' }],
    },
    ultimate: {
      name: 'ไอดินบำบัด', desc: 'ฟื้นพลังทั้งทีม 20% และเพิ่มป้องกันตัวเอง 2 เทิร์น',
      effects: [
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    blurb: 'หมอที่อึดกว่าใคร เพราะเสริมป้องกันให้ตัวเองทุกครั้งที่ปล่อยไม้ตาย',
  },
  granthe: {
    id: 'granthe', name: 'แกรนธ์', epithet: 'ทุบหินทลาย',
    rarity: 'SR', element: 'earth', role: 'striker', focus: 'all',
    stats: { hp: 1000, atk: 158, def: 76, spd: 102, crit: 12, critRate: 15 },
    skill: {
      name: 'ทุบซ้ำจุดเดิม', mp: 3, desc: 'โจมตีเดี่ยว 235%',
      effects: [{ kind: 'damage', mult: 2.35, target: 'one' }],
    },
    ultimate: {
      name: 'ค้อนสุดท้าย', desc: 'โจมตีเดี่ยว 550%',
      effects: [{ kind: 'damage', mult: 5.5, target: 'one' }],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงสุดในระดับ SR ของสายปฐพี สร้างมาเพื่อตีบอส',
  },
  stonewick: {
    id: 'stonewick', name: 'สโตนวิก', epithet: 'กำแพงหินโบราณ',
    rarity: 'SR', element: 'earth', role: 'guardian', focus: 'farm',
    stats: { hp: 1450, atk: 102, def: 120, spd: 72, crit: 5, critRate: 10 },
    skill: {
      name: 'ปราการหินโบราณ', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และฟื้นพลังตัวเอง 20%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'heal', percent: 0.2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ผาถล่มทับทั้งแถว', desc: 'โจมตีศัตรูทุกตัว 180% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 1.8, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    blurb: 'ตัวยืนที่ดูแลตัวเองได้เหมือนไกอัส เหมาะกับการไล่เก็บด่านยาว ๆ',
  },
  quarrin: {
    id: 'quarrin', name: 'ควอร์ริน', epithet: 'นักบวชแห่งเหมือง',
    rarity: 'SR', element: 'earth', role: 'mystic', focus: 'pvp',
    stats: { hp: 1020, atk: 90, def: 78, spd: 88, crit: 6, critRate: 10 },
    skill: {
      name: 'แร่ธาตุชโลม', mp: 3, desc: 'ฟื้นพลังทั้งทีม 18% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.18, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'ไอหินเยียวยา', desc: 'โจมตีศัตรูทุกตัว 190% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 1.9, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    blurb: 'หมอสายปฐพีที่กวาดดาเมจได้พอตัว ไล่เก็บด่านต่อกันหลายรอบไม่ต้องพัก',
  },
  titanis: {
    id: 'titanis', name: 'ไททานิส', epithet: 'จอมทัพศิลาดำ',
    rarity: 'SSR', element: 'earth', role: 'striker', focus: 'boss',
    stats: { hp: 1120, atk: 198, def: 84, spd: 98, crit: 16, critRate: 15 },
    skill: {
      name: 'ทุบจุดเดิมซ้ำ', mp: 3, desc: 'โจมตีเดี่ยว 245%',
      effects: [{ kind: 'damage', mult: 2.45, target: 'one' }],
    },
    ultimate: {
      name: 'ค้อนภูผาถล่ม', desc: 'โจมตีเดี่ยว 570%',
      effects: [{ kind: 'damage', mult: 5.7, target: 'one' }],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงที่สุดในสายปฐพี สร้างมาเพื่อตีบอสโดยเฉพาะ',
  },
  gaiathe: {
    id: 'gaiathe', name: 'ไกอาเธ', epithet: 'ผู้พิทักษ์แผ่นดิน',
    rarity: 'SSR', element: 'earth', role: 'striker', focus: 'all',
    stats: { hp: 1150, atk: 192, def: 90, spd: 92, crit: 14, critRate: 15 },
    skill: {
      name: 'แผ่นดินสั่นไหว', mp: 3, desc: 'โจมตีศัตรูทุกตัว 150% และมีโอกาสหนึ่งในสี่ทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.25 },
      ],
    },
    ultimate: {
      name: 'ธรณีถล่มมหันต์', desc: 'โจมตีศัตรูทุกตัว 320% และสตันทุกตัว 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 3.2, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
      ],
    },
    blurb: 'สายโจมตีที่ทนกว่าไททานิสหน่อย แลกกับดาเมจต่อตัวที่ต่ำลง',
  },
  monolir: {
    id: 'monolir', name: 'โมโนลิร์', epithet: 'หินยักษ์อมตะ',
    rarity: 'SSR', element: 'earth', role: 'guardian', focus: 'farm',
    stats: { hp: 1820, atk: 158, def: 148, spd: 78, crit: 9, critRate: 10 },
    skill: {
      name: 'กำแพงไม่มีวันแตก', mp: 3, desc: 'ดึงเป้าโจมตี 3 เทิร์น เพิ่มป้องกัน และได้เกราะ',
      effects: [
        { kind: 'status', status: 'taunt', turns: 3, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'น้ำหนักภูผาทับ', desc: 'โจมตีเดี่ยว 530% และฟื้นพลังตัวเอง 25%',
      effects: [
        { kind: 'damage', mult: 5.3, target: 'one' },
        { kind: 'heal', percent: 0.25, target: 'self' },
      ],
    },
    blurb: 'ตัวถังที่ทนที่สุดในสายปฐพี ยืนรับบอสได้นานที่สุดในทั้งหกธาตุ',
  },
  terravon: {
    id: 'terravon', name: 'เทอราวอน', epithet: 'เทพีไกอา',
    rarity: 'SSR', element: 'earth', role: 'mystic', focus: 'pvp',
    stats: { hp: 1300, atk: 150, def: 96, spd: 100, crit: 12, critRate: 10 },
    skill: {
      name: 'พรแผ่นดิน', mp: 3, desc: 'ฟื้นพลังทั้งทีม 20% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'ไกอาปลุกพิภพ', desc: 'โจมตีศัตรูทุกตัว 260% ฟื้นพลังทั้งทีม 20% และเพิ่มป้องกันตัวเอง 3 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'allFoes' },
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
      ],
    },
    blurb: 'หมอที่ยืนระยะได้ยาวที่สุดในสายปฐพี เสริมป้องกันตัวเองทุกครั้งที่ปล่อยไม้ตาย',
  },

  // ─────────── แสง ───────────
  lumis: {
    id: 'lumis', name: 'ลูมิส', epithet: 'ดาบแสงรุ่งอรุณ',
    rarity: 'R', element: 'light', role: 'striker', focus: 'farm',
    stats: { hp: 640, atk: 124, def: 44, spd: 106, crit: 13, critRate: 15 },
    skill: {
      name: 'ฟันแสงตรง', mp: 3, desc: 'โจมตีเดี่ยว 170%',
      effects: [{ kind: 'damage', mult: 1.7, target: 'one' }],
    },
    ultimate: {
      name: 'แสงทะลุมืด', desc: 'โจมตีเดี่ยว 330% และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'damage', mult: 3.3, target: 'one' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    blurb: 'ตัวเริ่มต้นสายแสงที่ป้องกันตัวเองได้นิดหน่อยหลังปล่อยไม้ตาย',
  },
  haloth: {
    id: 'haloth', name: 'เฮโลธ', epithet: 'ผู้พิทักษ์รัศมี',
    rarity: 'R', element: 'light', role: 'guardian', focus: 'pvp',
    stats: { hp: 1100, atk: 86, def: 95, spd: 66, crit: 6, critRate: 10 },
    skill: {
      name: 'รัศมีกำบัง', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ม่านแสงป้องกันทีม', desc: 'ให้เกราะทั้งทีม',
      effects: [{ kind: 'status', status: 'shield', turns: 1, target: 'allAllies' }],
    },
    blurb: 'แจกเกราะให้ทั้งทีมได้ตั้งแต่ระดับ R ตัวป้องกันที่คุ้มค่ามาก',
  },
  radia: {
    id: 'radia', name: 'ราเดีย', epithet: 'นักบวชแสงสีทอง',
    rarity: 'R', element: 'light', role: 'mystic', focus: 'boss',
    stats: { hp: 790, atk: 78, def: 64, spd: 88, crit: 6, critRate: 10 },
    skill: {
      name: 'แสงทองชโลม', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 26% และให้เกราะ',
      effects: [
        { kind: 'heal', percent: 0.26, target: 'lowestAlly' },
        { kind: 'status', status: 'shield', turns: 1, target: 'lowestAlly' },
      ],
    },
    ultimate: {
      name: 'ประกายทองคุ้มครอง', desc: 'ฟื้นพลังทั้งทีม 20% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'หมอเริ่มต้นสายแสง ฟื้นพร้อมเกราะกันตายให้ตัวที่เลือดน้อยสุด',
  },
  solenne: {
    id: 'solenne', name: 'โซเลนน์', epithet: 'ดาบแสงเที่ยงวัน',
    rarity: 'SR', element: 'light', role: 'striker', focus: 'all',
    stats: { hp: 870, atk: 166, def: 60, spd: 110, crit: 15, critRate: 15 },
    skill: {
      name: 'ฟันแสงเจิดจ้า', mp: 3, desc: 'โจมตีเดี่ยว 185% และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'damage', mult: 1.85, target: 'one' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'อรุณรุ่งทะลวง', desc: 'โจมตีเดี่ยว 350% และฟื้นพลังตัวเอง 15%',
      effects: [
        { kind: 'damage', mult: 3.5, target: 'one' },
        { kind: 'heal', percent: 0.15, target: 'self' },
      ],
    },
    blurb: 'สายโจมตีที่ดูแลตัวเองได้ ฟื้นพลังทุกครั้งที่ปล่อยไม้ตาย',
  },
  gleamer: {
    id: 'gleamer', name: 'กลีมเมอร์', epithet: 'โล่แสงประกาย',
    rarity: 'SR', element: 'light', role: 'guardian', focus: 'farm',
    stats: { hp: 1380, atk: 110, def: 114, spd: 80, crit: 6, critRate: 10 },
    skill: {
      name: 'เกราะแสงกำบัง', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ม่านแสงคุ้มภัยทีม', desc: 'ให้เกราะทั้งทีม และเพิ่มป้องกันตัวเอง 3 เทิร์น',
      effects: [
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
      ],
    },
    blurb: 'แจกเกราะทั้งทีมได้เหมือนคอรัลลุน อึดกว่าเดิมอีกขั้น',
  },
  auralin: {
    id: 'auralin', name: 'ออราลิน', epithet: 'นักบวชแห่งออร่า',
    rarity: 'SR', element: 'light', role: 'mystic', focus: 'pvp',
    stats: { hp: 960, atk: 112, def: 66, spd: 92, crit: 7, critRate: 10 },
    skill: {
      name: 'ออร่าชโลมทีม', mp: 3, desc: 'ฟื้นพลังทั้งทีม 20% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'ออร่าคุ้มครองนิรันดร์', desc: 'ฟื้นพลังทั้งทีม 28% ให้เกราะทั้งทีม และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.28, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'หมอเต็มตัวสายแสงระดับ SR ฟื้น เกราะ ล้างสถานะ ครบในท่าเดียว',
  },
  celestir: {
    id: 'celestir', name: 'เซเลสเทียร์', epithet: 'จอมทัพสวรรค์',
    rarity: 'SSR', element: 'light', role: 'striker', focus: 'boss',
    stats: { hp: 1070, atk: 210, def: 79, spd: 112, crit: 19, critRate: 15 },
    skill: {
      name: 'ลำแสงสวรรค์', mp: 3, desc: 'โจมตีศัตรูทุกตัว 150% และฟื้นพลังตัวเอง 10%',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'heal', percent: 0.1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'พิพากษาจากฟากฟ้า', desc: 'โจมตีศัตรูทุกตัว 310% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 3.1, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    blurb: 'สายโจมตีที่ฟื้นพลังทั้งตัวเองและทีมได้ กวาดแถวโดยไม่ต้องกลัวหมด HP',
  },
  luminael: {
    id: 'luminael', name: 'ลูมิเนล', epithet: 'เปลวแสงบริสุทธิ์',
    rarity: 'SSR', element: 'light', role: 'striker', focus: 'all',
    stats: { hp: 1030, atk: 218, def: 75, spd: 114, crit: 21, critRate: 15 },
    skill: {
      name: 'แสงเจาะทะลวง', mp: 3, desc: 'โจมตีเดี่ยว 195% และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'damage', mult: 1.95, target: 'one' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'แสงบริสุทธิ์ล้างมลทิน', desc: 'โจมตีเดี่ยว 520% และฟื้นพลังตัวเอง 20%',
      effects: [
        { kind: 'damage', mult: 5.2, target: 'one' },
        { kind: 'heal', percent: 0.2, target: 'self' },
      ],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงสุดในสายแสง ยืนระยะได้ด้วยไม้ตายที่ฟื้นพลังคืน',
  },
  holyra: {
    id: 'holyra', name: 'โฮลิรา', epithet: 'ปราการศักดิ์สิทธิ์',
    rarity: 'SSR', element: 'light', role: 'guardian', focus: 'farm',
    stats: { hp: 1700, atk: 164, def: 138, spd: 82, crit: 11, critRate: 10 },
    skill: {
      name: 'กำแพงศักดิ์สิทธิ์', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และได้เกราะ',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ม่านแสงคุ้มครองศักดิ์สิทธิ์', desc: 'ให้เกราะทั้งทีม ฟื้นพลังทั้งทีม 20% และล้างสถานะติดลบ',
      effects: [
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    blurb: 'ตัวถังที่ไม้ตายฟื้นทั้งทีมได้ด้วย แทบไม่ต้องมีหมอแยกเลย',
  },
  dawnessa: {
    id: 'dawnessa', name: 'ดอว์เนสซา', epithet: 'เทพีรุ่งอรุณ',
    rarity: 'SSR', element: 'light', role: 'mystic', focus: 'pvp',
    stats: { hp: 1230, atk: 178, def: 91, spd: 108, crit: 15, critRate: 10 },
    skill: {
      name: 'แสงรุ่งอรุณ', mp: 3, desc: 'ฟื้นพลังทั้งทีม 22% ให้เกราะทั้งทีม และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.22, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'รุ่งอรุณพิพากษา', desc: 'โจมตีศัตรูทุกตัว 330% สตันทุกตัว 1 เทิร์น และฟื้นพลังทั้งทีม 25%',
      effects: [
        { kind: 'damage', mult: 3.3, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
      ],
    },
    blurb: 'ทำได้ทุกอย่างเทียบเท่าเอเธเรีย แต่เน้นควบคุมสนามด้วยสตันมากกว่า',
  },

  // ─────────── มืด ───────────
  shadrin: {
    id: 'shadrin', name: 'เชดริน', epithet: 'มีดเงาราตรี',
    rarity: 'R', element: 'dark', role: 'striker', focus: 'farm',
    stats: { hp: 630, atk: 132, def: 42, spd: 110, crit: 18, critRate: 15 },
    skill: {
      name: 'แทงจากเงา', mp: 3, desc: 'โจมตีเดี่ยว 160% มีโอกาสสองในสิบทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.6, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.2 },
      ],
    },
    ultimate: {
      name: 'เงาทาบซ้ำ', desc: 'โจมตีเดี่ยว 340% แรงขึ้นเท่าตัวถ้าเป้าหมายสตันอยู่',
      effects: [{ kind: 'damage', mult: 3.4, target: 'one', bonusOn: 'stun', bonusMult: 2 }],
    },
    blurb: 'ตัวเริ่มต้นสายมืดที่มีโอกาสสตันแถมมาด้วย เข้าคู่กับตัวคุมจังหวะได้ดี',
  },
  gloomak: {
    id: 'gloomak', name: 'กลูแม็ก', epithet: 'ยามเฝ้าห้วงมืด',
    rarity: 'R', element: 'dark', role: 'guardian', focus: 'pvp',
    stats: { hp: 1070, atk: 92, def: 90, spd: 70, crit: 8, critRate: 10 },
    skill: {
      name: 'เงาปกคลุมกำบัง', mp: 3, desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ประหารในเงามืด', desc: 'โจมตีเดี่ยว 260% และมีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.5 },
      ],
    },
    blurb: 'ตัวถังสายมืดที่ไม้ตายจัดการเป้าหมายเดียวได้แรงกว่าตัวถังทั่วไป',
  },
  nightra: {
    id: 'nightra', name: 'ไนตรา', epithet: 'หมอผีราตรี',
    rarity: 'R', element: 'dark', role: 'mystic', focus: 'boss',
    stats: { hp: 800, atk: 80, def: 66, spd: 92, crit: 8, critRate: 10 },
    skill: {
      name: 'พรราตรีชโลม', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 24%',
      effects: [{ kind: 'heal', percent: 0.24, target: 'lowestAlly' }],
    },
    ultimate: {
      name: 'ดูดกลืนวิญญาณ', desc: 'โจมตีเดี่ยว 200% และฟื้นพลังตัวเอง 12%',
      effects: [
        { kind: 'damage', mult: 2.0, target: 'one' },
        { kind: 'heal', percent: 0.12, target: 'self' },
      ],
    },
    blurb: 'หมอที่ไม้ตายเป็นดาเมจดูดเลือด ต่างจากหมอสายอื่นที่เน้นฟื้นทีมล้วน ๆ',
  },
  ravenor: {
    id: 'ravenor', name: 'เรเวเนอร์', epithet: 'เงี้ยวปีกกา',
    rarity: 'SR', element: 'dark', role: 'striker', focus: 'all',
    stats: { hp: 820, atk: 180, def: 56, spd: 118, crit: 22, critRate: 15 },
    skill: {
      name: 'จิกจุดตาย', mp: 3, desc: 'โจมตีเดี่ยว 195% มีโอกาสสี่ในสิบทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.95, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.4 },
      ],
    },
    ultimate: {
      name: 'ฝูงปีกกาโฉบ', desc: 'โจมตีเดี่ยว 440%',
      effects: [{ kind: 'damage', mult: 4.4, target: 'one' }],
    },
    blurb: 'ความแรงคริสูงมากในระดับ SR เข้าคู่ได้ดีกับตัวที่ทำสตัน',
  },
  duskren: {
    id: 'duskren', name: 'ดัสก์เรน', epithet: 'อัศวินสนธยา',
    rarity: 'SR', element: 'dark', role: 'guardian', focus: 'farm',
    stats: { hp: 1320, atk: 114, def: 108, spd: 88, crit: 7, critRate: 10 },
    skill: {
      name: 'เกราะสนธยา', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ทิวาราตรีประสาน', desc: 'โจมตีเดี่ยว 300% และมีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 3.0, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.5 },
      ],
    },
    blurb: 'ตัวถังที่ไม้ตายจัดการเป้าหมายเดี่ยวได้แรงและมีโอกาสสตันด้วย',
  },
  moonfen: {
    id: 'moonfen', name: 'มูนเฟน', epithet: 'นักบวชจันทร์ดับ',
    rarity: 'SR', element: 'dark', role: 'mystic', focus: 'pvp',
    stats: { hp: 920, atk: 124, def: 62, spd: 95, crit: 10, critRate: 10 },
    skill: {
      name: 'แสงจันทร์ดับชโลม', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 28%',
      effects: [{ kind: 'heal', percent: 0.28, target: 'lowestAlly' }],
    },
    ultimate: {
      name: 'ดูดกลืนราตรี', desc: 'โจมตีเดี่ยว 280% และฟื้นพลังตัวเอง 15%',
      effects: [
        { kind: 'damage', mult: 2.8, target: 'one' },
        { kind: 'heal', percent: 0.15, target: 'self' },
      ],
    },
    blurb: 'หมอสายดูดเลือดที่ตีแรงกว่าไนตรา แลกกับฟื้นทีมโดยรวมน้อยกว่า',
  },
  voidryn: {
    id: 'voidryn', name: 'วอยด์ริน', epithet: 'เพชฌฆาตสุญญากาศ',
    rarity: 'SSR', element: 'dark', role: 'striker', focus: 'boss',
    stats: { hp: 1040, atk: 228, def: 76, spd: 124, crit: 25, critRate: 15 },
    skill: {
      name: 'จุดสังหารเงียบ', mp: 3, desc: 'โจมตีเดี่ยว 220% มีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.2, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.5 },
      ],
    },
    ultimate: {
      name: 'สุญญากาศกลืนกิน', desc: 'โจมตีเดี่ยว 560% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายสตันอยู่',
      effects: [{ kind: 'damage', mult: 5.6, target: 'one', bonusOn: 'stun', bonusMult: 1.5 }],
    },
    blurb: 'สตันแล้วจบด้วยไม้ตายที่แรงขึ้นทันที เข้าธีมนักฆ่าสายมืดเต็มตัว',
  },
  abyxen: {
    id: 'abyxen', name: 'อบิกเซน', epithet: 'จอมมฤตยูห้วงเหว',
    rarity: 'SSR', element: 'dark', role: 'striker', focus: 'all',
    stats: { hp: 990, atk: 234, def: 70, spd: 128, crit: 26, critRate: 15 },
    skill: {
      name: 'กรีดจากห้วงเหว', mp: 3, desc: 'โจมตีเดี่ยว 230% มีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 2.3, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.5 },
      ],
    },
    ultimate: {
      name: 'มฤตยูจากห้วงเหว', desc: 'โจมตีเดี่ยว 600% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายสตันอยู่',
      effects: [{ kind: 'damage', mult: 6.0, target: 'one', bonusOn: 'stun', bonusMult: 1.5 }],
    },
    blurb: 'ดาเมจต่อเป้าหมายเดียวสูงที่สุดในทั้งหกธาตุ เร็วและคริแรงที่สุดด้วย',
  },
  eclipsa: {
    id: 'eclipsa', name: 'เอคลิปซา', epithet: 'ราชินีคราส',
    rarity: 'SSR', element: 'dark', role: 'guardian', focus: 'farm',
    stats: { hp: 1620, atk: 172, def: 132, spd: 86, crit: 13, critRate: 10 },
    skill: {
      name: 'เงาคราสกำบัง', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และได้เกราะ',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'คราสกลืนแสง', desc: 'โจมตีศัตรูทุกตัว 260% และมีโอกาสครึ่งหนึ่งทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    blurb: 'ตัวป้องกันที่ตีแรงพอ ๆ กับสายโจมตี ล้มยากมากในสายมืด',
  },
  duskira: {
    id: 'duskira', name: 'ดัสก์คิรา', epithet: 'เทพีแห่งนิรันดร์มืด',
    rarity: 'SSR', element: 'dark', role: 'mystic', focus: 'pvp',
    stats: { hp: 1160, atk: 186, def: 89, spd: 110, crit: 16, critRate: 10 },
    skill: {
      name: 'พรแห่งนิรันดร์มืด', mp: 3, desc: 'ฟื้นพลังเพื่อนที่เลือดน้อยที่สุด 30% และให้เกราะ',
      effects: [
        { kind: 'heal', percent: 0.3, target: 'lowestAlly' },
        { kind: 'status', status: 'shield', turns: 1, target: 'lowestAlly' },
      ],
    },
    ultimate: {
      name: 'ดูดกลืนนิรันดร์', desc: 'โจมตีเดี่ยว 380% และฟื้นพลังตัวเอง 20%',
      effects: [
        { kind: 'damage', mult: 3.8, target: 'one' },
        { kind: 'heal', percent: 0.2, target: 'self' },
      ],
    },
    blurb: 'หมอสายมืดที่ไม้ตายเป็นดาเมจดูดเลือดหนัก ต่างจากหมอธาตุอื่นที่เน้นฟื้นทีม',
  },

  // ───────── ตู้ UR · ระดับ SR (ดู urbanner.js) ─────────
  pyros: {
    id: 'pyros', name: 'ไพรอส', epithet: 'นักดาบเปลวรุ่นสอง',
    rarity: 'SR', element: 'fire', role: 'striker', focus: 'farm',
    stats: { hp: 780, atk: 168, def: 54, spd: 106, crit: 16, critRate: 15 },
    skill: {
      name: 'ฟันเพลิงคม', mp: 3, desc: 'โจมตีเดี่ยว 185% และทำให้เป้าหมายติดไฟ 2 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.85, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
    ultimate: {
      name: 'เปลวราตรี', desc: 'โจมตีเดี่ยว 400% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายติดไฟอยู่',
      effects: [{ kind: 'damage', mult: 4, target: 'one', bonusOn: 'burn', bonusMult: 1.5 }],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SR สายโจมตีเน้นไล่เก็บด่าน',
  },
  terrak: {
    id: 'terrak', name: 'เทอร์รัก', epithet: 'ผู้พิทักษ์กำแพงหิน',
    rarity: 'SR', element: 'earth', role: 'guardian', focus: 'farm',
    stats: { hp: 1420, atk: 92, def: 118, spd: 74, crit: 5, critRate: 10 },
    skill: {
      name: 'โล่ศิลาแกร่ง', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'ปฐพีปะทุ', desc: 'โจมตีศัตรูทุกตัว 150% และมีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.5 },
      ],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SR สายป้องกัน ดึงเป้าและคุมสถานะได้ตั้งแต่ตัวถูก',
  },
  ventia: {
    id: 'ventia', name: 'เวนเทีย', epithet: 'นักบวชสายลม',
    rarity: 'SR', element: 'wind', role: 'mystic', focus: 'pvp',
    stats: { hp: 980, atk: 118, def: 70, spd: 112, crit: 8, critRate: 10 },
    skill: {
      name: 'สายลมเยียวยา', mp: 3, desc: 'ฟื้นพลังทั้งทีม 20% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.2, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'พายุชำระล้าง', desc: 'โจมตีศัตรูทุกตัว 200% และฟื้นพลังทั้งทีม 15%',
      effects: [
        { kind: 'damage', mult: 2, target: 'allFoes' },
        { kind: 'heal', percent: 0.15, target: 'allAllies' },
      ],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SR สายสนับสนุนที่เร็วพอจะฟื้นก่อนโดนอัดในสนามประลอง',
  },
  umbrose: {
    id: 'umbrose', name: 'อัมโบรส', epithet: 'นักล่าเงามืด',
    rarity: 'SR', element: 'dark', role: 'striker', focus: 'pvp',
    stats: { hp: 800, atk: 175, def: 50, spd: 108, crit: 18, critRate: 15 },
    skill: {
      name: 'จ้วงแทงเงา', mp: 3, desc: 'โจมตีเดี่ยว 190% และมีโอกาสหนึ่งในห้าทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 1.9, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.2 },
      ],
    },
    ultimate: {
      name: 'ประหารในเงามืด', desc: 'โจมตีเดี่ยว 430% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายสตัน',
      effects: [{ kind: 'damage', mult: 4.3, target: 'one', bonusOn: 'stun', bonusMult: 1.5 }],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SR สายโจมตี เน้นจัดการเป้าเดี่ยวในสนามประลอง',
  },
  solvane: {
    id: 'solvane', name: 'โซลเวน', epithet: 'อัศวินโล่แสง',
    rarity: 'SR', element: 'light', role: 'guardian', focus: 'boss',
    stats: { hp: 1380, atk: 96, def: 122, spd: 70, crit: 6, critRate: 10 },
    skill: {
      name: 'โล่แสงศักดิ์สิทธิ์', mp: 3, desc: 'ดึงเป้าโจมตี 3 เทิร์น และได้เกราะกันดาเมจหนึ่งครั้ง',
      effects: [
        { kind: 'status', status: 'taunt', turns: 3, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'แสงทวงคืน', desc: 'โจมตีเดี่ยว 500% และฟื้นพลังตัวเอง 20%',
      effects: [
        { kind: 'damage', mult: 5, target: 'one' },
        { kind: 'heal', percent: 0.2, target: 'self' },
      ],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SR สายป้องกัน ยืนรับบอสได้นานด้วยเกราะและฟื้นตัวเอง',
  },

  // ───────── ตู้ UR · ระดับ SSR ─────────
  aurex: {
    id: 'aurex', name: 'ออเร็กซ์', epithet: 'จอมวายุประจัญบาน',
    rarity: 'SSR', element: 'wind', role: 'striker', focus: 'boss',
    stats: { hp: 1100, atk: 205, def: 78, spd: 118, crit: 18, critRate: 15 },
    skill: {
      name: 'พายุใบมีด', mp: 3, desc: 'โจมตีศัตรูทุกตัว 150%',
      effects: [{ kind: 'damage', mult: 1.5, target: 'allFoes' }],
    },
    ultimate: {
      name: 'วายุสังหาร', desc: 'โจมตีเดี่ยว 540% แรงขึ้นครึ่งหนึ่งถ้าเป้าหมายสตัน',
      effects: [{ kind: 'damage', mult: 5.4, target: 'one', bonusOn: 'stun', bonusMult: 1.5 }],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SSR เร็วที่สุดในกลุ่มสายโจมตี เหมาะตีบอสก่อนใคร',
  },
  nerissa: {
    id: 'nerissa', name: 'เนริสซา', epithet: 'ผู้พิทักษ์วารี',
    rarity: 'SSR', element: 'water', role: 'guardian', focus: 'all',
    stats: { hp: 1650, atk: 150, def: 135, spd: 82, crit: 9, critRate: 10 },
    skill: {
      name: 'กำแพงคลื่นยักษ์', mp: 3, desc: 'ดึงเป้าโจมตี 2 เทิร์น เพิ่มป้องกัน และได้เกราะ',
      effects: [
        { kind: 'status', status: 'taunt', turns: 2, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
    ultimate: {
      name: 'มหาสมุทรถล่ม', desc: 'โจมตีศัตรูทุกตัว 260% และมีโอกาสสี่สิบเปอร์เซ็นต์ทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.4 },
      ],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SSR ตัวถังที่ใช้ได้ทุกสนามจริง ๆ',
  },
  gaiannon: {
    id: 'gaiannon', name: 'ไกอันนอน', epithet: 'ผู้เฒ่าแห่งไกอา',
    rarity: 'SSR', element: 'earth', role: 'mystic', focus: 'pvp',
    stats: { hp: 1280, atk: 145, def: 100, spd: 96, crit: 11, critRate: 10 },
    skill: {
      name: 'พรแผ่นดิน', mp: 3, desc: 'ฟื้นพลังทั้งทีม 22% และล้างสถานะติดลบ',
      effects: [
        { kind: 'heal', percent: 0.22, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'ไกอาปกป้อง', desc: 'โจมตีศัตรูทุกตัว 230% ฟื้นพลังทั้งทีม 25% และให้เกราะทั้งทีม',
      effects: [
        { kind: 'damage', mult: 2.3, target: 'allFoes' },
        { kind: 'heal', percent: 0.25, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
      ],
    },
    blurb: 'ตัวใหม่จากตู้ UR ระดับ SSR หมอที่ทั้งฟื้นทั้งกันดาเมจในเทิร์นเดียว',
  },

  // ───────── ตู้ UR · ระดับ UR ─────────
  //
  // ระดับความหายากสูงสุดของเกม ไม่อยู่ในสาย R → SR → SSR (ดู RARITIES/effectiveRarity
  // ใน data/ascension.js) จึงยกระดับตัวอื่นขึ้นมาเป็น UR ไม่ได้ ต้องสุ่มจากตู้ UR เท่านั้น
  // เพดานเลเวลตันที่ 100 และดันไปถึง 125 ได้เมื่อครบห้าดาว (ดู RARITY_CAPS ใน lib/leveling.js)
  nyxaroth: {
    id: 'nyxaroth', name: 'ไนซาโรธ', epithet: 'จอมมารเหนือราตรี',
    rarity: 'UR', element: 'dark', role: 'striker', focus: 'all',
    stats: { hp: 1250, atk: 255, def: 95, spd: 112, crit: 24, critRate: 15 },
    skill: {
      name: 'เขี้ยวอสูรราตรี', mp: 3, desc: 'โจมตีเดี่ยว 260% และมีโอกาสสี่สิบห้าเปอร์เซ็นต์ทำให้สตัน',
      effects: [
        { kind: 'damage', mult: 2.6, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.45 },
      ],
    },
    ultimate: {
      name: 'ราตรีกลืนกินภพ', desc: 'โจมตีเดี่ยว 700% แรงขึ้นหกสิบเปอร์เซ็นต์ถ้าเป้าหมายสตัน',
      effects: [{ kind: 'damage', mult: 7.0, target: 'one', bonusOn: 'stun', bonusMult: 1.6 }],
    },
    blurb: 'สายโจมตีระดับ UR ดาเมจต่อตัวสูงที่สุดในเกม สกิลและไม้ตายแรงกว่าสาย SSR ที่แรงที่สุดจริง ใช้ได้ทุกสนามตั้งแต่ฟาร์มยันตีบอส',
  },
  elyria: {
    id: 'elyria', name: 'เอลิเรีย', epithet: 'เทวีแสงนิรันดร์',
    rarity: 'UR', element: 'light', role: 'mystic', focus: 'all',
    stats: { hp: 1750, atk: 185, def: 135, spd: 104, crit: 16, critRate: 10 },
    skill: {
      name: 'แสงเยียวยานิรันดร์', mp: 3, desc: 'ฟื้นพลังทั้งทีม 32% ล้างสถานะติดลบ และให้เกราะทั้งทีม 2 เทิร์น',
      effects: [
        { kind: 'heal', percent: 0.32, target: 'allAllies' },
        { kind: 'cleanse', target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 2, target: 'allAllies' },
      ],
    },
    ultimate: {
      name: 'อรุณเทวประทาน', desc: 'โจมตีศัตรูทุกตัว 380% สตันทุกตัว 1 เทิร์น ฟื้นพลังทั้งทีม 40% และให้เกราะทั้งทีม',
      effects: [
        { kind: 'damage', mult: 3.8, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 1 },
        { kind: 'heal', percent: 0.4, target: 'allAllies' },
        { kind: 'status', status: 'shield', turns: 1, target: 'allAllies' },
      ],
    },
    blurb: 'สายสนับสนุนระดับ UR ฟื้น กันดาเมจ และตีแรงกว่าหมอ SSR ที่เก่งที่สุดในเกมทุกด้าน ใช้ได้ทุกสนาม',
  },
  abyssara: {
    id: 'abyssara', name: 'แอบิสซาร่า', epithet: 'ราชินีสมุทรลึก',
    rarity: 'UR', element: 'water', role: 'guardian', focus: 'all',
    stats: { hp: 1950, atk: 175, def: 155, spd: 88, crit: 12, critRate: 10 },
    skill: {
      name: 'กำแพงสมุทรลึก', mp: 3, desc: 'ดึงเป้าโจมตี 3 เทิร์น เพิ่มป้องกัน และได้เกราะ 2 เทิร์น',
      effects: [
        { kind: 'status', status: 'taunt', turns: 3, target: 'self' },
        { kind: 'status', status: 'defUp', turns: 3, target: 'self' },
        { kind: 'status', status: 'shield', turns: 2, target: 'self' },
      ],
    },
    ultimate: {
      name: 'มหาสมุทรล้างโลก', desc: 'โจมตีศัตรูทุกตัว 360% มีโอกาสหกสิบเปอร์เซ็นต์ทำให้สตัน และฟื้นพลังตัวเอง 35%',
      effects: [
        { kind: 'damage', mult: 3.6, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.6 },
        { kind: 'heal', percent: 0.35, target: 'self' },
      ],
    },
    blurb: 'สายป้องกันระดับ UR ตัวถังที่หนาและตีแรงกว่าตัวถัง SSR ทุกตัวในเกม ยืนรับได้ทุกสนามโดยไม่ต้องเปลี่ยนทีม',
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
