// ตัวเลขสมดุลทั้งเกมอยู่ในไฟล์นี้ไฟล์เดียว ปรับแล้ว push ระบบดีพลอยรันเอง

export const ENEMIES = {
  // ───────── บทที่ 1 ชายแดนตะวันออก ─────────
  ratling: {
    id: 'ratling', name: 'หนูป่าเวท', element: 'wind', mark: '🐀',
    stats: { hp: 260, atk: 55, def: 20, spd: 88, crit: 5 },
  },
  skeleton: {
    id: 'skeleton', name: 'โครงกระดูกเดินได้', element: 'dark', mark: '💀',
    stats: { hp: 380, atk: 72, def: 40, spd: 70, crit: 5 },
  },
  frostwolf: {
    id: 'frostwolf', name: 'หมาป่าน้ำแข็ง', element: 'water', mark: '🐺',
    stats: { hp: 420, atk: 85, def: 35, spd: 100, crit: 10 },
  },
  hexer: {
    id: 'hexer', name: 'นักเวทเถื่อน', element: 'fire', mark: '🔮',
    stats: { hp: 340, atk: 95, def: 25, spd: 82, crit: 8 },
    skill: {
      name: 'ต้องสาปเพลิง', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.4, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
  },
  golem: {
    id: 'golem', name: 'กอเลมหินผู้เฝ้าประตู', element: 'earth', mark: '🗿', boss: true,
    stats: { hp: 2150, atk: 140, def: 92, spd: 58, crit: 8 },
  },

  // ───────── บทที่ 2 ป่าหมอกนิรันดร์ ─────────
  sprite: {
    id: 'sprite', name: 'นางไม้จอมซน', element: 'wind', mark: '🧚',
    stats: { hp: 1136, atk: 258, def: 57, spd: 124, crit: 14 },
  },
  mandrake: {
    id: 'mandrake', name: 'รากแมนเดรก', element: 'earth', mark: '🌿',
    stats: { hp: 1923, atk: 209, def: 117, spd: 54, crit: 5 },
    skill: {
      name: 'เสียงกรีดร้อง', mp: 3,
      effects: [{ kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.35 }],
    },
  },
  direboar: {
    id: 'direboar', name: 'หมูป่ายักษ์', element: 'earth', mark: '🐗',
    stats: { hp: 2229, atk: 289, def: 92, spd: 76, crit: 8 },
  },
  treant: {
    id: 'treant', name: 'ทรีแอนต์เฒ่า', element: 'earth', mark: '🌳', boss: true,
    stats: { hp: 7866, atk: 389, def: 177, spd: 52, crit: 8 },
    skill: {
      name: 'รากพันธนาการ', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.3, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.5 },
      ],
    },
  },

  // ───────── บทที่ 3 ทะเลทรายกระดูก ─────────
  scorpion: {
    id: 'scorpion', name: 'แมงป่องทราย', element: 'earth', mark: '🦂',
    stats: { hp: 3324, atk: 594, def: 132, spd: 106, crit: 16 },
  },
  mummy: {
    id: 'mummy', name: 'มัมมี่คำสาป', element: 'dark', mark: '🧟',
    stats: { hp: 5233, atk: 502, def: 198, spd: 62, crit: 6 },
  },
  efreet: {
    id: 'efreet', name: 'อิฟรีตทะเลทราย', element: 'fire', mark: '🕯️',
    stats: { hp: 4173, atk: 693, def: 144, spd: 98, crit: 12 },
    skill: {
      name: 'ลมร้อนแผดเผา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
  },
  sandwyrm: {
    id: 'sandwyrm', name: 'พญาหนอนทราย', element: 'earth', mark: '🪱', boss: true,
    stats: { hp: 21923, atk: 842, def: 281, spd: 70, crit: 10 },
    skill: {
      name: 'กลืนทั้งเป็น', mp: 3,
      effects: [{ kind: 'damage', mult: 2.4, target: 'one' }],
    },
  },

  // ───────── บทที่ 4 ยอดเขาเพลิงนิทรา ─────────
  lavahound: {
    id: 'lavahound', name: 'สุนัขลาวา', element: 'fire', mark: '🐕',
    stats: { hp: 3327, atk: 441, def: 151, spd: 112, crit: 14 },
  },
  ashmage: {
    id: 'ashmage', name: 'นักเวทเถ้าถ่าน', element: 'fire', mark: '🌋',
    stats: { hp: 2979, atk: 507, def: 121, spd: 94, crit: 10 },
    skill: {
      name: 'ฝนเถ้าถ่าน', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },
  rocdrake: {
    id: 'rocdrake', name: 'มังกรน้อยหินผา', element: 'wind', mark: '🐉',
    stats: { hp: 3966, atk: 471, def: 175, spd: 120, crit: 15 },
  },
  emberlord: {
    id: 'emberlord', name: 'จอมเพลิงหลับใหล', element: 'fire', mark: '👹', boss: true,
    stats: { hp: 20312, atk: 662, def: 270, spd: 100, crit: 14 },
    skill: {
      name: 'เปลวหมื่นปี', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.9, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },

  // ───────── บทที่ 5 ปราการเงามืด ─────────
  wraith: {
    id: 'wraith', name: 'วิญญาณอาฆาต', element: 'dark', mark: '👻',
    stats: { hp: 2668, atk: 372, def: 125, spd: 128, crit: 20 },
  },
  darkknight: {
    id: 'darkknight', name: 'อัศวินดำ', element: 'dark', mark: '⚔️',
    stats: { hp: 3978, atk: 347, def: 213, spd: 92, crit: 12 },
    skill: {
      name: 'ดาบสาปแช่ง', mp: 3,
      effects: [{ kind: 'damage', mult: 2.2, target: 'one' }],
    },
  },
  sentinel: {
    id: 'sentinel', name: 'ผู้พิทักษ์แสงร้าง', element: 'light', mark: '🛡️',
    stats: { hp: 4563, atk: 308, def: 242, spd: 80, crit: 8 },
    skill: {
      name: 'ปราการศักดิ์สิทธิ์', mp: 3,
      effects: [
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
  },
  voidking: {
    id: 'voidking', name: 'ราชันสุญญากาศ', element: 'dark', mark: '🌑', boss: true,
    stats: { hp: 21060, atk: 512, def: 280, spd: 116, crit: 18 },
    skill: {
      name: 'กลืนกินแสงสุดท้าย', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.1, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.4 },
      ],
    },
  },

  // ───────── บทที่ 6 หุบเหวเสียงกรีดร้อง ─────────
  banshee: {
    id: 'banshee', name: 'แบนชีคร่ำครวญ', element: 'dark', mark: '👤',
    stats: { hp: 16074, atk: 1083, def: 335, spd: 132, crit: 20 },
    skill: {
      name: 'เสียงกรีดสลายขวัญ', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  gargoyle: {
    id: 'gargoyle', name: 'การ์กอยล์เฝ้าผา', element: 'earth', mark: '🗿',
    stats: { hp: 25334, atk: 957, def: 601, spd: 88, crit: 10 },
  },
  harpy: {
    id: 'harpy', name: 'ฮาร์ปีล่าเหยื่อ', element: 'wind', mark: '🦅',
    stats: { hp: 15026, atk: 1174, def: 305, spd: 148, crit: 24 },
  },
  abysswing: {
    id: 'abysswing', name: 'ปีกเหวลึก', element: 'dark', mark: '🕷️', boss: true,
    stats: { hp: 125798, atk: 1712, def: 784, spd: 128, crit: 20 },
    skill: {
      name: 'ปีกคลุมเหว', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.0, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },

  // ───────── บทที่ 7 นครลอยฟ้าที่ร้างไป ─────────
  automaton: {
    id: 'automaton', name: 'จักรกลผู้พิทักษ์', element: 'light', mark: '🤖',
    stats: { hp: 20807, atk: 752, def: 630, spd: 96, crit: 12 },
    skill: {
      name: 'ลำแสงตัดสิน', mp: 3,
      effects: [{ kind: 'damage', mult: 2.4, target: 'one' }],
    },
  },
  stormcaller: {
    id: 'stormcaller', name: 'ผู้เรียกพายุ', element: 'wind', mark: '⚡',
    stats: { hp: 15606, atk: 944, def: 368, spd: 156, crit: 22 },
    skill: {
      name: 'สายฟ้าซัดทั่วฟ้า', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.8, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.35 },
      ],
    },
  },
  seraph: {
    id: 'seraph', name: 'เซราฟตกสวรรค์', element: 'light', mark: '👼',
    stats: { hp: 18406, atk: 848, def: 490, spd: 120, crit: 18 },
    skill: {
      name: 'ปีกหกคู่', mp: 3,
      // ฟื้นพลังตัวเองแค่ 5% ไม่ใช่ 15%
      // ตอน 15% มันฟื้นเร็วกว่าที่ทีมตีเข้า การต่อสู้จึงไม่มีวันจบ
      // แล้วหมดเวลาไปเองทั้งที่ค่าพลังบอกว่าด่านนี้ง่ายกว่าบอส
      effects: [
        { kind: 'damage', mult: 1.9, target: 'allFoes' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  skylord: {
    id: 'skylord', name: 'เจ้าแห่งนภาที่ถูกลืม', element: 'light', mark: '☀️', boss: true,
    stats: { hp: 132047, atk: 1376, def: 857, spd: 140, crit: 22 },
    skill: {
      name: 'คำสั่งจากเบื้องบน', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.3, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.4 },
      ],
    },
  },
}

export const FIRST_CLEAR_GEMS = 30

/** ตัวช่วยประกอบบท ลดการพิมพ์ซ้ำของด่านสามสิบด่าน */
function chapter(number, name, subtitle, rows) {
  return {
    number,
    name,
    subtitle,
    stages: rows.map((r, i) => ({
      id: `${number}-${i + 1}`,
      chapter: number,
      name: r.name,
      intro: r.intro,
      exp: r.exp,
      enemies: r.enemies,
    })),
  }
}

const e = (id, level) => ({ id, level })

export const CHAPTERS = [
  chapter(1, 'ชายแดนตะวันออก', 'จุดเริ่มต้นของการเดินทาง', [
    { name: 'ชายป่าฝั่งตะวันออก', intro: 'หนูป่าตัวหนึ่งขวางทางอยู่ ไม่ใช่เรื่องใหญ่', exp: 25, enemies: [e('ratling', 1)] },
    { name: 'ทางเดินใต้ร่มไม้', intro: 'คราวนี้มากันสองตัว', exp: 35, enemies: [e('ratling', 1), e('ratling', 1)] },
    { name: 'สุสานร้าง', intro: 'กระดูกที่ขยับได้เอง ไม่รู้ว่าใครปลุกมันขึ้นมา', exp: 45, enemies: [e('skeleton', 1), e('skeleton', 1)] },
    { name: 'ลำธารเยือกแข็ง', intro: 'ฝูงหมาป่าเร็วกว่าที่คิด ระวังโดนตัดหน้า', exp: 55, enemies: [e('frostwolf', 1), e('frostwolf', 1)] },
    { name: 'ค่ายพักของพวกนอกรีต', intro: 'นักเวทเถื่อนสาปให้ติดไฟได้ อย่าปล่อยให้มันร่ายซ้ำ', exp: 70, enemies: [e('hexer', 1), e('hexer', 1), e('ratling', 1)] },
    { name: 'ประตูหินโบราณ', intro: 'กอเลมยืนเฝ้ามาหลายร้อยปี ลำพังคนเดียวคงไม่พอ', exp: 120, enemies: [e('golem', 1)] },
  ]),

  chapter(2, 'ป่าหมอกนิรันดร์', 'ป่าที่ไม่เคยเห็นแสงอาทิตย์', [
    { name: 'ชายป่าในหมอก', intro: 'นางไม้ตัวเล็กแต่เร็วจนน่ารำคาญ', exp: 140, enemies: [e('sprite', 2), e('sprite', 2)] },
    { name: 'ดงรากไม้', intro: 'รากแมนเดรกกรีดร้องได้ ระวังโดนสตันทั้งทีม', exp: 160, enemies: [e('mandrake', 2), e('sprite', 3)] },
    { name: 'ทางด่านหมูป่า', intro: 'ตัวใหญ่ ตีแรง แต่ช้า', exp: 180, enemies: [e('direboar', 3), e('direboar', 3)] },
    { name: 'บึงหมอกลึก', intro: 'มองไม่เห็นว่ามีอะไรรออยู่ข้างหน้ากี่ตัว', exp: 210, enemies: [e('mandrake', 4), e('direboar', 4), e('sprite', 5)] },
    { name: 'ลานพิธีกลางป่า', intro: 'ที่นี่มีคนเคยเซ่นไหว้อะไรบางอย่างไว้', exp: 240, enemies: [e('mandrake', 5), e('mandrake', 5), e('direboar', 5)] },
    { name: 'ใจกลางป่าหมอก', intro: 'ต้นไม้ต้นนั้นขยับ และมันมองมาที่คุณ', exp: 380, enemies: [e('treant', 3)] },
  ]),

  chapter(3, 'ทะเลทรายกระดูก', 'ที่ที่กองคาราวานหายไปทั้งกอง', [
    { name: 'เนินทรายแรก', intro: 'แมงป่องซ่อนอยู่ใต้ทราย และมันเร็วมาก', exp: 420, enemies: [e('scorpion', 3), e('scorpion', 3)] },
    { name: 'ซากคาราวาน', intro: 'ของยังอยู่ครบ แต่คนหายไปหมด', exp: 460, enemies: [e('mummy', 3), e('scorpion', 4)] },
    { name: 'วิหารใต้ทราย', intro: 'อากาศร้อนจนหายใจลำบาก', exp: 500, enemies: [e('efreet', 4), e('mummy', 4)] },
    { name: 'ลานสุสานกษัตริย์', intro: 'มัมมี่ลุกขึ้นพร้อมกันทั้งลาน', exp: 560, enemies: [e('mummy', 5), e('mummy', 5), e('mummy', 5)] },
    { name: 'ทะเลเพลิงกลางทราย', intro: 'อิฟรีตสองตัวเผาทั้งสนามได้ในเทิร์นเดียว', exp: 640, enemies: [e('efreet', 1), e('scorpion', 2), e('mummy', 2)] },
    { name: 'รังของพญาหนอน', intro: 'พื้นทรายสั่น แล้วมันก็โผล่ขึ้นมา', exp: 900, enemies: [e('sandwyrm', 4)] },
  ]),

  chapter(4, 'ยอดเขาเพลิงนิทรา', 'ภูเขาไฟที่หลับมานานเกินไป', [
    { name: 'ตีนเขาลาวา', intro: 'พื้นร้อนจนรองเท้าไหม้', exp: 980, enemies: [e('lavahound', 4), e('lavahound', 4)] },
    { name: 'ทางขึ้นคดเคี้ยว', intro: 'มังกรน้อยบินโฉบจากด้านบน', exp: 1060, enemies: [e('rocdrake', 4), e('lavahound', 5)] },
    { name: 'ถ้ำเถ้าถ่าน', intro: 'นักเวทที่นี่ทำให้ทั้งทีมติดไฟได้', exp: 1140, enemies: [e('ashmage', 5), e('ashmage', 5)] },
    { name: 'สันเขาแตกร้าว', intro: 'ทั้งสามตัวเร็วกว่าทีมส่วนใหญ่', exp: 1260, enemies: [e('rocdrake', 6), e('rocdrake', 6), e('lavahound', 6)] },
    { name: 'ปากปล่องภูเขาไฟ', intro: 'ความร้อนเริ่มกัดกินพลังชีวิตเอง', exp: 1400, enemies: [e('ashmage', 7), e('rocdrake', 7), e('lavahound', 7)] },
    { name: 'บัลลังก์เพลิง', intro: 'สิ่งที่หลับอยู่ใต้ภูเขาลืมตาขึ้นแล้ว', exp: 2000, enemies: [e('emberlord', 5)] },
  ]),

  chapter(5, 'ปราการเงามืด', 'ปลายทางที่ไม่มีใครกลับมาเล่า', [
    { name: 'สะพานวิญญาณ', intro: 'เสียงร้องดังมาจากทุกทิศ', exp: 2200, enemies: [e('wraith', 5), e('wraith', 5)] },
    { name: 'ลานประหาร', intro: 'อัศวินดำยืนรออยู่แล้วเหมือนรู้ว่าคุณจะมา', exp: 2400, enemies: [e('darkknight', 5), e('wraith', 6)] },
    { name: 'หอคอยแสงร้าง', intro: 'ผู้พิทักษ์ที่ลืมไปแล้วว่ากำลังปกป้องอะไร', exp: 2600, enemies: [e('sentinel', 6), e('darkknight', 6)] },
    { name: 'ระเบียงไร้เงา', intro: 'สามตัวนี้ไม่มีตัวไหนอ่อนเลยสักตัว', exp: 2900, enemies: [e('darkknight', 7), e('sentinel', 7), e('wraith', 8)] },
    { name: 'ประตูสุดท้าย', intro: 'ด่านก่อนถึงบัลลังก์ อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 3200, enemies: [e('sentinel', 8), e('darkknight', 8), e('darkknight', 8)] },
    { name: 'บัลลังก์สุญญากาศ', intro: 'ไม่มีเสียง ไม่มีแสง มีแต่สิ่งที่นั่งอยู่ตรงนั้น', exp: 5000, enemies: [e('voidking', 6)] },
  ]),

  chapter(6, 'หุบเหวเสียงกรีดร้อง', 'ที่ที่เสียงไม่เคยหยุด', [
    { name: 'ปากเหว', intro: 'เสียงกรีดร้องดังขึ้นก่อนที่จะเห็นตัว', exp: 5400, enemies: [e('harpy', 2), e('harpy', 2)] },
    { name: 'หน้าผาการ์กอยล์', intro: 'รูปปั้นที่ขยับได้ และมันหนามาก', exp: 5800, enemies: [e('gargoyle', 2), e('harpy', 3)] },
    { name: 'ถ้ำคร่ำครวญ', intro: 'แบนชีทำให้ทั้งทีมขยับไม่ได้ ระวังโดนซ้ำ', exp: 6200, enemies: [e('banshee', 3), e('gargoyle', 3)] },
    { name: 'สะพานหินแตก', intro: 'ทั้งสามตัวเร็วกว่าทีมส่วนใหญ่', exp: 6800, enemies: [e('harpy', 4), e('banshee', 4), e('gargoyle', 4)] },
    { name: 'ก้นเหว', intro: 'แสงส่องไม่ถึงตรงนี้แล้ว', exp: 7400, enemies: [e('banshee', 5), e('banshee', 5), e('gargoyle', 6)] },
    { name: 'รังของปีกเหวลึก', intro: 'อะไรบางอย่างกางปีกคลุมทั้งหุบเหว', exp: 11000, enemies: [e('abysswing', 3)] },
  ]),

  chapter(7, 'นครลอยฟ้าที่ร้างไป', 'เมืองที่คนทิ้งไปแต่เครื่องจักรยังทำงาน', [
    { name: 'ท่าเทียบเรือลม', intro: 'จักรกลยังตรวจตราอยู่เหมือนไม่มีอะไรเกิดขึ้น', exp: 12000, enemies: [e('automaton', 2), e('automaton', 2)] },
    { name: 'ถนนลอยฟ้า', intro: 'ลมแรงจนยืนแทบไม่อยู่', exp: 12800, enemies: [e('stormcaller', 2), e('automaton', 3)] },
    { name: 'หอสังเกตการณ์', intro: 'เซราฟตัวนี้ฟื้นพลังตัวเองได้ ต้องเร่งเก็บ', exp: 13600, enemies: [e('seraph', 1), e('stormcaller', 1)] },
    { name: 'ลานพิธีกลางเมือง', intro: 'สามตัวนี้ไม่มีตัวไหนอ่อนเลย', exp: 14800, enemies: [e('automaton', 2), e('seraph', 1), e('stormcaller', 1)] },
    { name: 'บันไดสู่ยอดหอ', intro: 'ด่านสุดท้ายก่อนถึงยอด อย่าขึ้นไปด้วยทีมที่บาดเจ็บ', exp: 16000, enemies: [e('automaton', 1), e('seraph', 1)] },
    { name: 'ยอดหอแห่งนภา', intro: 'สิ่งที่เฝ้าเมืองนี้มาตลอดหันมามองคุณ', exp: 24000, enemies: [e('skylord', 4)] },
  ]),
]
export const STAGES = CHAPTERS.flatMap((c) => c.stages)

// ─────────────────────────────────────────────────────────────
// ระดับความยาก
//
// ใช้ด่านชุดเดิมแล้วคูณค่าพลังศัตรูกับรางวัลขึ้นไป แทนการเขียนด่านใหม่อีกสองชุด
// เพราะถ้าเขียนแยก การปรับสมดุลทีหนึ่งต้องไล่แก้สามที่ แล้ววันหนึ่งจะไม่ตรงกัน
//
// รหัสด่านต่อท้ายด้วย @hard หรือ @demon ความคืบหน้าจึงแยกกันเองโดยไม่ต้องทำอะไรเพิ่ม
// ─────────────────────────────────────────────────────────────

/**
 * เพดานรอบของด่านทั่วไป
 *
 * ต้องมีเพราะถ้าทีมตีไม่พอที่จะฆ่าศัตรูและศัตรูก็ฆ่าทีมไม่ได้
 * การต่อสู้จะวนไปเรื่อย ๆ ไม่มีวันจบ ผู้เล่นต้องนั่งกดจนกว่าจะยอมแพ้เอง
 * ตั้งไว้สูงกว่าประลองเพราะบอสในเนื้อเรื่องเลือดเยอะกว่ามาก
 */
export const STORY_ROUND_LIMIT = 50

export const DIFFICULTIES = [
  { id: 'normal', name: 'ปกติ', suffix: '', reward: 1, gems: 30, ilvlBonus: 0 },
  { id: 'hard', name: 'ยาก', suffix: '@hard', reward: 2, gems: 50, ilvlBonus: 1 },
  { id: 'demon', name: 'ปีศาจ', suffix: '@demon', reward: 6, gems: 100, ilvlBonus: 2 },
]

// ─────────────────────────────────────────────────────────────
// ความยากไล่ต่อเนื่องข้ามโหมด
//
// เดิมโหมดยากคือการคูณศัตรูทั้งเจ็ดบทด้วยเลขเดียวกัน
// ผลคือบทที่ 1 โหมดยากยังง่ายกว่าบทที่ 7 โหมดปกติมาก
// ผู้เล่นที่ผ่านเนื้อเรื่องจบแล้วจึงกวาดโหมดยากตั้งแต่บทแรกได้ทันที
//
// เปลี่ยนมากำหนดว่าแต่ละบทแต่ละโหมดควรใช้ทีมเลเวลเท่าไหร่จึงจะผ่าน
// แล้วคำนวณตัวคูณย้อนกลับจากเลเวลที่ต้องการ
// โหมดยากบทแรกจึงเริ่มตรงที่โหมดปกติบทสุดท้ายจบพอดี และไล่ขึ้นต่อไปเอง
// ─────────────────────────────────────────────────────────────

/** เลเวลที่แนะนำสำหรับแต่ละบทของแต่ละโหมด ใช้แสดงในแผนที่ด่าน */
export const TARGET_LEVEL = {
  normal: [5, 10, 18, 28, 38, 50, 60],
  hard: [60, 63, 66, 70, 73, 77, 80],
  demon: [80, 82, 84, 86, 87, 89, 90],
}

/**
 * ตัวคูณค่าพลังศัตรูของแต่ละบทในแต่ละโหมด
 *
 * ไม่ได้คิดจากสูตร แต่คำนวณจากค่าพลังทีมที่ผู้เล่นควรมีตอนนั้น
 * โดยตั้งให้ศัตรูอยู่ราว 1.35 เท่าของค่าพลังทีม ซึ่งเป็นจุดที่จำลองแล้วชนะราว 85%
 *
 * โหมดปกติคงไว้ที่ 1 เกือบทั้งหมด เพราะปรับสมดุลด้วยการจำลองมาแล้ว
 * ยกเว้นบทที่ 7 ที่ลดลงให้ใช้ทีมเลเวล 60 แทน 70
 *
 * โหมดยากบทที่ 1 ตั้งให้เท่ากับโหมดปกติบทที่ 7 พอดี แล้วไล่ขึ้นต่อไปเอง
 * ตัวเลขจึงสูงมากในบทต้น เพราะศัตรูบทแรกมีค่าพลังพื้นฐานน้อย
 * ต้องคูณสามสิบเท่าจึงจะเทียบเท่าบอสบทสุดท้าย
 */
export const STAGE_SCALE = {
  // บทที่ 1 ถึง 4 ปรับด้วยมือจากการจำลอง เพราะผู้เล่นตอนนั้นยังไม่มีทีมครบห้าตัว
  // สูตรคำนวณจากทีมอ้างอิงใช้ไม่ได้ จะได้ตัวเลขที่คนเพิ่งเริ่มเล่นไม่มีทางผ่าน
  normal: [1, 1, 0.75, 1.0, 1.6, 0.963, 0.97],

  // ตั้งแต่บทที่ 5 ขึ้นไปคำนวณจากค่าพลังทีมที่ควรมี คูณ 1.35
  // บทแรกของแต่ละโหมดจึงต่อจากบทสุดท้ายของโหมดก่อนหน้าพอดี
  hard: [45.2, 12.403, 4.778, 5.35, 5.45, 1.302, 1.239],
  demon: [57.5, 15.514, 5.871, 6.389, 6.345, 1.477, 1.374],
}

/**
 * ความยากของด่านย่อยภายในบท เทียบกับบอสของบทนั้น
 *
 * ก่อนหน้านี้ค่าพลังของด่านย่อยเป็นตัวเลขที่ตั้งไว้ตั้งแต่แรกแล้วแก้ทีละด่านหลายรอบ
 * ผลคือด่าน 4 กับ 5 ของเกือบทุกบทแรงกว่าบอสของบทนั้นเอง
 * และบทที่ 7 ด่านย่อยอยู่แค่สามสิบกว่าเปอร์เซ็นต์แล้วกระโดดไปร้อยที่บอส
 *
 * เปลี่ยนมาคำนวณให้ทุกด่านอยู่บนเส้นเดียวกัน โดยบอสเป็นจุดสูงสุดของบทเสมอ
 */
export const WITHIN_CHAPTER = [0.45, 0.56, 0.67, 0.78, 0.89, 1]

/**
 * ค่าพลังดิบของด่าน ใช้เป็นตัวหารเพื่อหาตัวคูณที่ต้องใช้
 *
 * คำนวณในไฟล์นี้เองด้วยสูตรเดียวกับ combatPower แทนการนำเข้าจาก power.js
 * เพราะ power.js นำเข้า stats.js ซึ่งนำเข้าไฟล์นี้ จะกลายเป็นวงทันที
 */
function rawPower(stage, scale = 1) {
  return (stage.enemies ?? []).reduce((sum, x) => {
    const m = ENEMIES[x.id]
    if (!m) return sum
    const g = 1 + ((x.level ?? 1) - 1) * 0.08
    const s = m.stats
    // พลังป้องกันคูณด้วยเลขยกกำลัง 0.6 ไม่ใช่เชิงเส้น ต้องคิดแยก
    return (
      sum +
      s.hp * g * scale * 0.3 +
      s.atk * g * scale * 4.2 +
      s.def * g * Math.pow(scale, 0.6) * 3 +
      s.spd * 2.5 +
      s.crit * 6
    )
  }, 0)
}

/**
 * หาตัวคูณที่ทำให้ค่าพลังของด่านเท่ากับเป้าหมาย
 *
 * แก้ด้วยการแบ่งครึ่งช่วงแทนการหารตรง ๆ
 * เพราะค่าพลังไม่ได้เป็นสัดส่วนตรงกับตัวคูณ มีทั้งพจน์ที่ไม่คูณเลย
 * (ความเร็วกับคริติคอล) และพจน์ที่คูณแบบยกกำลัง (พลังป้องกัน)
 */
function solveScale(stage, want) {
  let lo = 0.01
  let hi = 200
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2
    if (rawPower(stage, mid) < want) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const scaleCache = new Map()

export function stageScale(chapter, difficultyId = 'normal') {
  const table = STAGE_SCALE[difficultyId] ?? STAGE_SCALE.normal
  return table[Math.max(0, Math.min(table.length - 1, chapter - 1))]
}

/**
 * ตัวคูณของด่านหนึ่งด่าน รวมทั้งระดับความยากและตำแหน่งในบท
 * บอสของบทได้ตัวคูณเต็ม ด่านก่อนหน้าลดหลั่นลงไปตามเส้น
 */
export function scaleForStage(stage, difficultyId = 'normal') {
  const key = `${stage.id}:${difficultyId}`
  if (scaleCache.has(key)) return scaleCache.get(key)

  const chapter = CHAPTERS[(stage.chapter ?? 1) - 1]
  if (!chapter) return stageScale(stage.chapter ?? 1, difficultyId)

  const index = chapter.stages.findIndex((x) => x.id === stage.id)
  if (index < 0) return stageScale(stage.chapter ?? 1, difficultyId)

  const boss = chapter.stages[chapter.stages.length - 1]
  const bossScale = stageScale(stage.chapter, difficultyId)
  const want = rawPower(boss, bossScale) * (WITHIN_CHAPTER[index] ?? 1)

  const scale = solveScale(stage, want)
  scaleCache.set(key, scale)
  return scale
}

export function difficultyOf(id) {
  const at = typeof id === 'string' ? id.indexOf('@') : -1
  if (at < 0) return DIFFICULTIES[0]
  return DIFFICULTIES.find((d) => d.suffix === id.slice(at)) ?? DIFFICULTIES[0]
}

export function baseIdOf(id) {
  const at = typeof id === 'string' ? id.indexOf('@') : -1
  return at < 0 ? id : id.slice(0, at)
}

export function stageAt(baseId, difficultyId = 'normal') {
  const base = STAGES.find((s) => s.id === baseId)
  if (!base) return null
  const d = DIFFICULTIES.find((x) => x.id === difficultyId) ?? DIFFICULTIES[0]
  const scale = scaleForStage(base, d.id)

  return {
    ...base,
    id: base.id + d.suffix,
    difficulty: d.id,
    name: d.id === 'normal' ? base.name : `${base.name} · ${d.name}`,
    exp: Math.round(base.exp * d.reward),
    // คูณค่าพลังตรง ๆ แทนการดันเลเวล เพราะต้องคูณได้หลายเท่าในบทต้น ๆ
    // ซึ่งการดันเลเวลทำไม่ได้ ศัตรูบทแรกมีค่าพลังพื้นฐานน้อยเกินกว่าจะไต่ทัน
    enemies: base.enemies.map((x) => ({ ...x, statScale: scale })),
  }
}

/** ผ่านบทนั้นครบทุกด่านในระดับความยากที่กำหนดหรือยัง */
export function chapterClearedAt(progress = {}, number, difficultyId = 'normal') {
  const ch = CHAPTERS[number - 1]
  if (!ch) return false
  const d = DIFFICULTIES.find((x) => x.id === difficultyId) ?? DIFFICULTIES[0]
  return ch.stages.every((s) => (progress[s.id + d.suffix] ?? 0) > 0)
}

/**
 * ลานฝึก เล่นซ้ำได้ไม่จำกัด ให้ค่าประสบการณ์อย่างเดียว ไม่มีเพชร
 *
 * ที่ไม่ให้เพชรเพราะรางวัลที่ฟาร์มซ้ำได้ไม่จำกัดคือช่องโหว่ที่ Security Rules
 * ปิดไม่ได้เลย ส่วนค่าประสบการณ์ปลอดภัยกว่าเพราะมีเพดานเลเวลกั้นอยู่แล้ว
 */
export const TRAINING = [
  {
    id: 't-1', name: 'ลานฝึกชั้นต้น', intro: 'หุ่นฟางที่ขยับได้ ไม่เจ็บใครแต่ทนได้นาน',
    training: true, exp: 90, requires: '1-2',
    enemies: [e('skeleton', 3), e('skeleton', 3)],
  },
  {
    id: 't-2', name: 'ลานฝึกชั้นกลาง', intro: 'คู่ซ้อมที่เอาจริงขึ้น เตรียมใจไว้หน่อย',
    training: true, exp: 200, requires: '1-5',
    enemies: [e('frostwolf', 8), e('hexer', 8), e('frostwolf', 8)],
  },
  {
    id: 't-3', name: 'ลานฝึกชั้นสูง', intro: 'ของจริงจากป่าหมอก ไม่ใช่หุ่นฟางแล้ว',
    training: true, exp: 520, requires: '2-4',
    enemies: [e('direboar', 8), e('mandrake', 8), e('sprite', 10)],
  },
  {
    id: 't-4', name: 'ลานฝึกยอดยุทธ์', intro: 'คู่ซ้อมระดับที่เจอในทะเลทราย',
    training: true, exp: 1200, requires: '3-4',
    enemies: [e('efreet', 3), e('mummy', 4), e('scorpion', 5)],
  },
  {
    id: 't-5', name: 'ลานฝึกเพลิงนิทรา', intro: 'ซ้อมกับของจริงจากยอดเขา',
    training: true, exp: 3000, requires: '4-4',
    enemies: [e('lavahound', 9), e('ashmage', 9), e('rocdrake', 9)],
  },
  {
    id: 't-6', name: 'ลานฝึกเงามืด', intro: 'ไม่มีอะไรให้ซ้อมนอกจากสิ่งที่เกือบฆ่าคุณได้',
    training: true, exp: 8000, requires: '5-4',
    enemies: [e('darkknight', 10), e('sentinel', 10), e('wraith', 11)],
  },
  {
    id: 't-7', name: 'ลานฝึกหุบเหว', intro: 'เสียงกรีดร้องที่ซ้อมจนชินแล้ว',
    training: true, exp: 20000, requires: '6-4',
    enemies: [e('banshee', 4), e('harpy', 5), e('gargoyle', 5)],
  },
  {
    id: 't-8', name: 'ลานฝึกนภา', intro: 'จักรกลที่ไม่รู้จักเหนื่อย เหมาะกับการซ้อมที่สุด',
    training: true, exp: 48000, requires: '7-4',
    enemies: [e('automaton', 1), e('seraph', 1), e('stormcaller', 1)],
  },
]

/**
 * ด่านเก็บเพชร ใช้โควตารวมกันวันละ 3 ครั้ง
 *
 * ที่ต้องจำกัดเพราะรางวัลที่ฟาร์มได้ไม่จำกัดคือช่องโหว่ที่ปิดไม่ได้เลย
 * แต่พอจำกัดเป็นรายวัน กฎจะตรวจได้จริง เพราะเทียบวันจากนาฬิกาเซิร์ฟเวอร์
 *
 * จำนวนเพชรของแต่ละเหมืองผูกกับด่านที่ต้องผ่านก่อน กฎจึงตรวจซ้ำได้ว่า
 * คนที่ขอเพชร 280 เม็ดผ่านด่าน 4-4 มาจริงหรือเปล่า
 */
export const GEM_RUNS_PER_DAY = 3

export const GEM_STAGES = [
  {
    id: 'g-1', accountExp: 600, name: 'เหมืองคริสตัลร้าง', intro: 'คริสตัลยังฝังอยู่ในผนัง แต่มีอะไรบางอย่างเฝ้าไว้',
    gemStage: true, gems: 60, exp: 60, requires: '1-3',
    enemies: [e('golem', 8), e('skeleton', 8), e('frostwolf', 8)],
  },
  {
    id: 'g-2', accountExp: 2000, name: 'เหมืองใต้รากไม้', intro: 'รากไม้ชอนไชจนผนังเหมืองแตก และมีอะไรตามเข้ามา',
    gemStage: true, gems: 110, exp: 220, requires: '2-4',
    enemies: [e('treant', 2), e('mandrake', 10), e('direboar', 10)],
  },
  {
    id: 'g-3', accountExp: 5000, name: 'เหมืองแก้วทะเลทราย', intro: 'ทรายหลอมเป็นแก้วจากความร้อนใต้ดิน',
    gemStage: true, gems: 180, exp: 620, requires: '3-4',
    enemies: [e('sandwyrm', 1), e('efreet', 2), e('mummy', 2)],
  },
  {
    id: 'g-4', accountExp: 12000, name: 'เหมืองแก่นภูเขาไฟ', intro: 'คริสตัลที่นี่ยังร้อนอยู่ และเจ้าของมันยังไม่ตาย',
    gemStage: true, gems: 280, exp: 1500, requires: '4-4',
    enemies: [e('emberlord', 2), e('ashmage', 4), e('rocdrake', 4)],
  },
  {
    id: 'g-5', accountExp: 24000, name: 'คลังสมบัตินภา', intro: 'เมืองที่คนทิ้งไปแต่สมบัติยังอยู่',
    gemStage: true, gems: 480, exp: 9000, requires: '7-2',
    enemies: [e('automaton', 1), e('seraph', 1)],
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

/**
 * ผ่านบทนั้นครบทุกด่านหรือยัง
 * ใช้เป็นเงื่อนไขปลดล็อกโหมดที่ไม่ควรเปิดตั้งแต่เริ่มเกม
 */
export function chapterCleared(progress = {}, number) {
  const ch = CHAPTERS[number - 1]
  return ch ? ch.stages.every((s) => (progress[s.id] ?? 0) > 0) : false
}

/** เงื่อนไขปลดล็อกของแต่ละโหมด */
export const UNLOCKS = {
  arena: { chapter: 1, label: 'ประลอง' },
  worldboss: { chapter: 3, label: 'บอสโลก' },
}

export function getChapter(number) {
  return CHAPTERS.find((c) => c.number === number) ?? CHAPTERS[0]
}
