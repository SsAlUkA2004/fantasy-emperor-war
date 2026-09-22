// ตัวเลขสมดุลทั้งเกมอยู่ในไฟล์นี้ไฟล์เดียว ปรับแล้ว push ระบบดีพลอยรันเอง

export const ENEMIES = {
  // ───────── บทที่ 1 ชายแดนตะวันออก ─────────
  ratling: {
    id: 'ratling', name: 'หนูป่าเวท', element: 'wind', mark: '🐀',
    stats: { hp: 260, atk: 55, def: 17, spd: 88, crit: 5 },
  },
  skeleton: {
    id: 'skeleton', name: 'โครงกระดูกเดินได้', element: 'dark', mark: '💀',
    stats: { hp: 380, atk: 72, def: 22, spd: 70, crit: 5 },
  },
  frostwolf: {
    id: 'frostwolf', name: 'หมาป่าน้ำแข็ง', element: 'water', mark: '🐺',
    stats: { hp: 420, atk: 85, def: 26, spd: 100, crit: 10 },
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
    stats: { hp: 2150, atk: 140, def: 31, spd: 58, crit: 8 },
  },

  // ───────── บทที่ 2 ป่าหมอกนิรันดร์ ─────────
  sprite: {
    id: 'sprite', name: 'นางไม้จอมซน', element: 'wind', mark: '🧚',
    stats: { hp: 1136, atk: 258, def: 57, spd: 124, crit: 14 },
  },
  mandrake: {
    id: 'mandrake', name: 'รากแมนเดรก', element: 'earth', mark: '🌿',
    stats: { hp: 1923, atk: 209, def: 63, spd: 54, crit: 5 },
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
    stats: { hp: 7866, atk: 389, def: 86, spd: 52, crit: 8 },
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
    stats: { hp: 5233, atk: 502, def: 151, spd: 62, crit: 6 },
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
    stats: { hp: 21923, atk: 842, def: 185, spd: 70, crit: 10 },
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
    stats: { hp: 3966, atk: 471, def: 141, spd: 120, crit: 15 },
  },
  emberlord: {
    id: 'emberlord', name: 'จอมเพลิงหลับใหล', element: 'fire', mark: '👹', boss: true,
    stats: { hp: 20312, atk: 662, def: 146, spd: 100, crit: 14 },
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
    stats: { hp: 3978, atk: 347, def: 104, spd: 92, crit: 12 },
    skill: {
      name: 'ดาบสาปแช่ง', mp: 3,
      effects: [{ kind: 'damage', mult: 2.2, target: 'one' }],
    },
  },
  sentinel: {
    id: 'sentinel', name: 'ผู้พิทักษ์แสงร้าง', element: 'light', mark: '🛡️',
    stats: { hp: 4563, atk: 308, def: 92, spd: 80, crit: 8 },
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
    stats: { hp: 21060, atk: 512, def: 113, spd: 116, crit: 18 },
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
    stats: { hp: 25334, atk: 957, def: 287, spd: 88, crit: 10 },
  },
  harpy: {
    id: 'harpy', name: 'ฮาร์ปีล่าเหยื่อ', element: 'wind', mark: '🦅',
    stats: { hp: 15026, atk: 1174, def: 305, spd: 148, crit: 24 },
  },
  abysswing: {
    id: 'abysswing', name: 'ปีกเหวลึก', element: 'dark', mark: '🕷️', boss: true,
    stats: { hp: 125798, atk: 1712, def: 377, spd: 128, crit: 20 },
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
    // เดิม def 630/atk 752 (สัดส่วน 0.84 สูงกว่าศัตรูตัวอื่นมาก) ตอนเพิ่มบทที่ 9-15 โหมดยาก/ปีศาจ
    // ต้องใช้ค่าพลังอ้างอิงสูงกว่าเดิมมาก ด่านย่อยที่มีตัวนี้เลยทนเกินไปจนสู้ไม่จบในเพดานรอบ ลดสัดส่วนลงมาที่ ~0.3
    stats: { hp: 20807, atk: 752, def: 226, spd: 96, crit: 12 },
    skill: {
      name: 'ลำแสงตัดสิน', mp: 3,
      effects: [{ kind: 'damage', mult: 2.4, target: 'one' }],
    },
  },
  stormcaller: {
    id: 'stormcaller', name: 'ผู้เรียกพายุ', element: 'wind', mark: '⚡',
    stats: { hp: 15606, atk: 944, def: 283, spd: 156, crit: 22 },
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
    stats: { hp: 18406, atk: 848, def: 254, spd: 120, crit: 18 },
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
    // เดิม def 857 สูงกว่าบอสบทอื่นตามสัดส่วนมาก (บอสอื่นแถวปลายเกม def/atk ราว 0.4-0.55
    // ตัวนี้เคยอยู่ที่ 0.62) พอไฟไหม้ไม่ทะลุพลังป้องกันแบบเดิม สูตรลดทอนดาเมจแบบไม่เป็นเส้นตรง
    // (100/(100+def)) ทำให้ตัวนี้ทนกว่าบอสอื่นที่ค่าพลังรวมเท่ากันมาก จนสู้ไม่จบในเพดานรอบ ย้ายเป็น 688
    // ตอนนั้น ต่อมาตอนเพิ่มบทที่ 9-15 โหมดยาก/ปีศาจต้องใช้บอสบทนี้ที่ scale สูงกว่าเดิมมาก (ดู
    // STAGE_SCALE.hard/demon) ที่สัดส่วน 0.46 ก็ยังทนเกินไปอีกครั้งที่ scale ระดับนั้น ลดลงอีกเหลือ ~0.22
    stats: { hp: 132047, atk: 1497, def: 329, spd: 140, crit: 22 },
    skill: {
      name: 'คำสั่งจากเบื้องบน', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.3, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.4 },
      ],
    },
  },

  // ───────── บทที่ 8 เหมืองคริสตัลใต้พิภพ ─────────
  crystalgolem: {
    id: 'crystalgolem', name: 'กอเลมคริสตัล', element: 'earth', mark: '💎',
    // เดิม def700/atk820 (สัดส่วน 0.85) สูงกว่าศัตรูตัวอื่นในเกมมาก แม้แต่สกายลอร์ดที่เคยแก้ไป
    // ก็ยังอยู่แค่ 0.62 พอด่านย่อยที่มีตัวนี้ต้องยกสเกลขึ้นให้ถึงเป้าค่าพลัง ทีมสู้ไม่ทันเพดานรอบ
    // ย้ายส่วนของ def ไปเป็น atk แทน (ค่าพลังรวมเท่าเดิม) ให้สัดส่วนใกล้เคียงศัตรูตัวอื่น (~0.5)
    stats: { hp: 23000, atk: 973, def: 292, spd: 90, crit: 12 },
    skill: {
      name: 'หมัดผลึกอัดแน่น', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.4, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  gembat: {
    id: 'gembat', name: 'ค้างคาวอัญมณี', element: 'wind', mark: '🦇',
    stats: { hp: 17000, atk: 980, def: 294, spd: 160, crit: 24 },
    skill: {
      name: 'โฉบปีกคม', mp: 3,
      effects: [{ kind: 'damage', mult: 1.6, target: 'one' }],
    },
  },
  shardwraith: {
    id: 'shardwraith', name: 'วิญญาณเศษแก้ว', element: 'dark', mark: '🔪',
    // ปรับสัดส่วน def/atk ลงมาใกล้เคียงศัตรูตัวอื่น (~0.5) ด้วยเหตุผลเดียวกับ crystalgolem
    stats: { hp: 19500, atk: 926, def: 278, spd: 130, crit: 22 },
    skill: {
      name: 'เศษคริสตัลกรีดเลือด', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
  },
  prismwyrm: {
    id: 'prismwyrm', name: 'พญางูปริซึม', element: 'light', mark: '🌈',
    // ปรับสัดส่วน def/atk ลงมาใกล้เคียงศัตรูตัวอื่น ด้วยเหตุผลเดียวกับ crystalgolem
    // (เดิม 0.5 ตอนเพิ่มบทที่ 9-15 โหมดยาก/ปีศาจต้องใช้ค่าพลังอ้างอิงสูงกว่าเดิมมาก ลดลงอีกเหลือ ~0.3)
    stats: { hp: 20500, atk: 915, def: 275, spd: 115, crit: 18 },
    // ฟื้นพลังตัวเองเดิม 12% ที่เลเวลอ้างอิงเดิมไม่มีปัญหา แต่พอต้องใช้ที่เลเวลสูงกว่านี้มาก
    // (โหมดยาก/ปีศาจของบทที่ 9-15) ฟื้นเร็วกว่าที่ทีมตีเข้า ลดเหลือ 5% เหมือนเซราฟบทที่ 7
    skill: {
      name: 'แสงหักเหเยียวยา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.3, target: 'allFoes' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  geodetitan: {
    id: 'geodetitan', name: 'ไททันแก่นคริสตัล', element: 'earth', mark: '🔷', boss: true,
    // สัดส่วน def/atk ราว 0.46 ใกล้เคียงบอสบทอื่นตามที่แก้ให้สกายลอร์ดไว้ ไม่ให้ทนเกินจริงในเพดานรอบ
    stats: { hp: 148000, atk: 1560, def: 343, spd: 112, crit: 20 },
    skill: {
      name: 'พิภพแตกร้าว', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.0, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.4 },
      ],
    },
  },

  // ───────── ดันเจี้ยนเหรด — ผู้เฝ้าคลังอุปกรณ์ปลายเกม (ดู data/raiddungeon.js) ─────────
  // ตัวเลขจูนด้วยการจำลองสู้จริง (ทีม ENDGAME ไม่ใส่อุปกรณ์ ที่เลเวล/ดาวต่ำสุดที่เกณฑ์ของแต่ละ
  // ระดับความยากอนุญาต) ไม่ได้อิงค่าพลังดิบของบอสบทที่ 6-8 ในตารางนี้ (เช่นไททันแก่นคริสตัล)
  // เพราะตัวเลขพวกนั้นถูกออกแบบให้ต้องผ่าน STAGE_SCALE/BAND_SCALE หารทอนก่อนใช้งานเสมอ
  // เอามาใช้ตรง ๆ ในดันเจี้ยนที่ไม่มีตัวหารพวกนั้นจะแรงเกินจริงหลายเท่า (ดูรอยคอมมิตที่แก้เรื่องนี้)
  vaultguard1: {
    id: 'vaultguard1', name: 'ยามเฝ้าคลังชายแดน', element: 'earth', mark: '🛡️', boss: true,
    stats: { hp: 40000, atk: 950, def: 285, spd: 108, crit: 16 },
    skill: {
      name: 'โล่กระแทกพิภพ', mp: 3,
      effects: [{ kind: 'damage', mult: 1.8, target: 'allFoes' }],
    },
  },
  vaultguard2: {
    id: 'vaultguard2', name: 'โจรเกราะเพลิง', element: 'fire', mark: '🔥', boss: true,
    stats: { hp: 37000, atk: 1020, def: 306, spd: 125, crit: 20 },
    skill: {
      name: 'เปลวริบทรัพย์', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
  },
  vaultguard3: {
    id: 'vaultguard3', name: 'นักฆ่าเงาสนธยา', element: 'dark', mark: '🗡️', boss: true,
    stats: { hp: 35000, atk: 1090, def: 355, spd: 140, crit: 24 },
    skill: {
      name: 'เงาลอบกรีด', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.9, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.3 },
      ],
    },
  },
  vaultknight1: {
    id: 'vaultknight1', name: 'แม่ทัพเกราะเงิน', element: 'water', mark: '⚔️', boss: true,
    stats: { hp: 62000, atk: 1350, def: 470, spd: 112, crit: 18 },
    skill: {
      name: 'คลื่นบัญชาศึก', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.7, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  vaultknight2: {
    id: 'vaultknight2', name: 'ยักษ์เฝ้าสมบัติ', element: 'earth', mark: '🗻', boss: true,
    stats: { hp: 68000, atk: 1260, def: 378, spd: 90, crit: 14 },
    skill: {
      name: 'กำปั้นทลายคลัง', mp: 3,
      effects: [{ kind: 'damage', mult: 2.2, target: 'one' }],
    },
  },
  vaultknight3: {
    id: 'vaultknight3', name: 'จอมเวทผนึกคลัง', element: 'light', mark: '✨', boss: true,
    stats: { hp: 58000, atk: 1440, def: 420, spd: 128, crit: 22 },
    skill: {
      name: 'ผนึกแสงตัดสิน', mp: 3,
      // ฟื้นพลังตัวเองแค่ 5% ไม่ใช่มากกว่านั้น ด้วยเหตุผลเดียวกับเซราฟบทที่ 7 (ดูหมายเหตุที่นั่น)
      // ฟื้นเร็วกว่านี้จะแซงหน้าที่ทีมตีเข้า การต่อสู้จึงไม่มีวันจบภายในเพดานรอบ
      effects: [
        { kind: 'damage', mult: 1.9, target: 'allFoes' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  vaultlord1: {
    id: 'vaultlord1', name: 'ราชันเกราะทองคำ', element: 'light', mark: '👑', boss: true,
    stats: { hp: 85000, atk: 1700, def: 510, spd: 118, crit: 20 },
    skill: {
      name: 'พระราชโองการทองคำ', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.1, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.35 },
      ],
    },
  },
  vaultlord2: {
    id: 'vaultlord2', name: 'เทพอสูรเฝ้าขุมทรัพย์', element: 'earth', mark: '🔱', boss: true,
    stats: { hp: 92000, atk: 1590, def: 477, spd: 96, crit: 16 },
    skill: {
      name: 'ตรีศูลทลายแผ่นดิน', mp: 3,
      effects: [{ kind: 'damage', mult: 2.4, target: 'allFoes' }],
    },
  },
  vaultlord3: {
    id: 'vaultlord3', name: 'จอมมารผนึกอมตะ', element: 'dark', mark: '😈', boss: true,
    stats: { hp: 81000, atk: 1770, def: 475, spd: 146, crit: 26 },
    skill: {
      name: 'อสูรกลืนวิญญาณ', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.0, target: 'one' },
        { kind: 'status', status: 'burn', turns: 3, target: 'one' },
      ],
    },
  },

  // ───────── บทที่ 9 ทะเลสีเลือดใต้พสุธา ─────────
  // ทุกบทตั้งแต่นี้ (9-15) ต่อค่าพลังดิบจากบทที่ 8 ด้วยตัวคูณทบต้น 1.1 เท่าต่อบท (hp/atk/def)
  // แล้วปล่อยให้ STAGE_SCALE (คำนวณจากค่าพลังทีมอ้างอิง คูณ 0.5 เหมือนบทที่ 5-8) เป็นตัวปรับละเอียด
  // สัดส่วน def/atk คงไว้ราว 0.45-0.55 ตามบทเรียนจากบทที่ 7-8 (ดูหมายเหตุ crystalgolem/skylord ด้านบน)
  coralfang: {
    id: 'coralfang', name: 'เขี้ยวปะการังเลือด', element: 'water', mark: '🪸',
    stats: { hp: 25300, atk: 1070, def: 235, spd: 95, crit: 14 },
  },
  leechswarm: {
    id: 'leechswarm', name: 'ฝูงปลิงเลือด', element: 'dark', mark: '🩸',
    stats: { hp: 18700, atk: 1078, def: 237, spd: 165, crit: 26 },
    skill: {
      name: 'ดูดกลืนโลหิต', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.4, target: 'one' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  tideknight: {
    id: 'tideknight', name: 'อัศวินกระแสเลือด', element: 'water', mark: '🌊',
    stats: { hp: 21450, atk: 1019, def: 224, spd: 128, crit: 20 },
    skill: {
      name: 'คลื่นเลือดซัด', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  abysscrab: {
    id: 'abysscrab', name: 'ปูอสูรก้นสมุทร', element: 'earth', mark: '🦀',
    stats: { hp: 22550, atk: 1007, def: 222, spd: 108, crit: 16 },
  },
  crimsonleviathan: {
    id: 'crimsonleviathan', name: 'วารีอสูรเลือดโบราณ', element: 'water', mark: '🩸', boss: true,
    stats: { hp: 162800, atk: 1716, def: 378, spd: 118, crit: 20 },
    skill: {
      name: 'วังวนโลหิตนิรันดร์', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.1, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },

  // ───────── บทที่ 10 โรงหลอมเครื่องจักรโบราณ ─────────
  forgesentry: {
    id: 'forgesentry', name: 'ยามเฝ้าโรงหลอม', element: 'earth', mark: '🔧',
    stats: { hp: 27830, atk: 1177, def: 259, spd: 92, crit: 14 },
  },
  moltengear: {
    id: 'moltengear', name: 'เฟืองลาวา', element: 'fire', mark: '⚙️',
    stats: { hp: 20570, atk: 1186, def: 261, spd: 158, crit: 24 },
    skill: {
      name: 'เฟืองบดสลาย', mp: 3,
      effects: [{ kind: 'damage', mult: 1.6, target: 'one' }],
    },
  },
  sparkwraith: {
    id: 'sparkwraith', name: 'วิญญาณประกายไฟ', element: 'fire', mark: '⚡',
    stats: { hp: 23595, atk: 1120, def: 246, spd: 134, crit: 22 },
    skill: {
      name: 'ประกายเพลิงกระจาย', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 2, target: 'allFoes' },
      ],
    },
  },
  ironjudge: {
    id: 'ironjudge', name: 'ผู้พิพากษาเหล็กกล้า', element: 'earth', mark: '⚖️',
    stats: { hp: 24805, atk: 1107, def: 244, spd: 110, crit: 18 },
    skill: {
      name: 'คำพิพากษาเหล็ก', mp: 3,
      effects: [{ kind: 'damage', mult: 2.3, target: 'one' }],
    },
  },
  pyrotitan: {
    id: 'pyrotitan', name: 'ไททันเพลิงแห่งโรงหลอม', element: 'fire', mark: '🔥', boss: true,
    stats: { hp: 179080, atk: 1888, def: 415, spd: 114, crit: 22 },
    skill: {
      name: 'สายเพลิงหลอมสลาย', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.15, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },

  // ───────── บทที่ 11 ทุ่งสายลมไร้จุดจบ ─────────
  galeraptor: {
    id: 'galeraptor', name: 'แร้งสายลม', element: 'wind', mark: '🦅',
    stats: { hp: 30613, atk: 1295, def: 285, spd: 150, crit: 22 },
  },
  thunderhawk: {
    id: 'thunderhawk', name: 'เหยี่ยวสายฟ้า', element: 'wind', mark: '🦉',
    stats: { hp: 22627, atk: 1304, def: 287, spd: 172, crit: 26 },
    skill: {
      name: 'จิกฟ้าผ่า', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.4 },
      ],
    },
  },
  cloudserpent: {
    id: 'cloudserpent', name: 'งูเมฆ', element: 'wind', mark: '🐍',
    stats: { hp: 25955, atk: 1233, def: 271, spd: 138, crit: 20 },
    skill: {
      name: 'พันรัดม่านเมฆ', mp: 3,
      effects: [{ kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.35 }],
    },
  },
  stormpriest: {
    id: 'stormpriest', name: 'นักบวชพายุ', element: 'wind', mark: '🌀',
    stats: { hp: 27286, atk: 1218, def: 268, spd: 122, crit: 18 },
    skill: {
      name: 'มนตร์เรียกพายุ', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  tempestarchon: {
    id: 'tempestarchon', name: 'อาร์คอนพายุนิรันดร์', element: 'wind', mark: '⛈️', boss: true,
    // สปีด/คริสูงกว่าบอสบทอื่นราวนี้พอสมควร (158/26) รวมกับสตันหมู่โอกาส 0.4 ตอนจำลองแล้วทีมอ้างอิง
    // โดนล็อกจนตีไม่ทันเพดานรอบ ลดโอกาสสตันเหลือ 0.25 ให้สมดุลกับความเร็ว/คริที่สูงอยู่แล้ว
    stats: { hp: 196988, atk: 2076, def: 457, spd: 158, crit: 26 },
    skill: {
      name: 'พิพากษาสายลมกลืนฟ้า', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.2, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.25 },
      ],
    },
  },

  // ───────── บทที่ 12 มหาวิหารแสงจันทร์ขาว ─────────
  moonpriest: {
    id: 'moonpriest', name: 'นักบวชจันทร์ขาว', element: 'light', mark: '🌙',
    stats: { hp: 33674, atk: 1425, def: 314, spd: 108, crit: 18 },
    skill: {
      name: 'แสงจันทร์เยียวยา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.3, target: 'allFoes' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  lightward: {
    id: 'lightward', name: 'ผู้พิทักษ์แสงขาว', element: 'light', mark: '🛡️',
    stats: { hp: 24890, atk: 1435, def: 316, spd: 96, crit: 14 },
    skill: {
      name: 'ปราการจันทรา', mp: 3,
      effects: [
        { kind: 'status', status: 'defUp', turns: 2, target: 'self' },
        { kind: 'status', status: 'shield', turns: 1, target: 'self' },
      ],
    },
  },
  seraphguard: {
    id: 'seraphguard', name: 'การ์เดียนปีกแสง', element: 'light', mark: '🕊️',
    stats: { hp: 28550, atk: 1356, def: 298, spd: 132, crit: 22 },
    skill: {
      name: 'ปีกแสงบาดตา', mp: 3,
      effects: [{ kind: 'damage', mult: 1.7, target: 'one' }],
    },
  },
  radiantscribe: {
    id: 'radiantscribe', name: 'อาลักษณ์แสงจ้า', element: 'light', mark: '📜',
    stats: { hp: 30014, atk: 1340, def: 295, spd: 118, crit: 18 },
    skill: {
      name: 'อักขระผนึกพลัง', mp: 3,
      effects: [{ kind: 'status', status: 'skillLock', turns: 1, target: 'one', chance: 0.4 }],
    },
  },
  lunarchseraph: {
    id: 'lunarchseraph', name: 'อัครทูตจันทร์ขาว', element: 'light', mark: '🌕', boss: true,
    stats: { hp: 216687, atk: 2284, def: 502, spd: 126, crit: 24 },
    skill: {
      name: 'พิพากษาจันทร์เพ็ญ', mp: 3,
      // ตอนจำลองแล้วทีมอ้างอิงโดนสตันหมู่ซ้ำจนตีไม่ทันเพดานรอบ ลดโอกาสสตันจาก 0.4 เหลือ 0.22
      // (ต่ำกว่าบทอื่นที่มีสตันหมู่เหมือนกัน เพราะบทนี้ค่าพลังดิบสูงอยู่แล้วจากช่วงเลเวลอ้างอิง)
      effects: [
        { kind: 'damage', mult: 2.25, target: 'allFoes' },
        { kind: 'status', status: 'stun', turns: 1, target: 'allFoes', chance: 0.22 },
      ],
    },
  },

  // ───────── บทที่ 13 เขาวงกตเงาไร้ก้นบึ้ง ─────────
  shadehunter: {
    id: 'shadehunter', name: 'นักล่าเงา', element: 'dark', mark: '🗡️',
    stats: { hp: 37042, atk: 1567, def: 345, spd: 136, crit: 24 },
    skill: {
      name: 'เงี่ยงเงาลอบกรีด', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.7, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
  },
  wraithcollector: {
    id: 'wraithcollector', name: 'ผู้เก็บวิญญาณ', element: 'dark', mark: '👻',
    stats: { hp: 27379, atk: 1578, def: 347, spd: 118, crit: 18 },
    skill: {
      name: 'เก็บเกี่ยววิญญาณ', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.4, target: 'allFoes' },
        { kind: 'heal', percent: 0.05, target: 'self' },
      ],
    },
  },
  nightstalker: {
    id: 'nightstalker', name: 'ผู้สะกดรอยราตรี', element: 'dark', mark: '🌑',
    stats: { hp: 31405, atk: 1491, def: 328, spd: 148, crit: 26 },
  },
  hollowknight: {
    id: 'hollowknight', name: 'อัศวินกลวงเปล่า', element: 'dark', mark: '⚔️',
    stats: { hp: 33015, atk: 1474, def: 324, spd: 104, crit: 16 },
    skill: {
      name: 'ดาบไร้วิญญาณ', mp: 3,
      effects: [{ kind: 'damage', mult: 2.3, target: 'one' }],
    },
  },
  voidsovereign: {
    id: 'voidsovereign', name: 'จ้าวเงาสุญญาศูนย์', element: 'dark', mark: '🕳️', boss: true,
    stats: { hp: 238355, atk: 2512, def: 553, spd: 132, crit: 24 },
    skill: {
      name: 'สูญสิ้นไร้ตัวตน', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.3, target: 'allFoes' },
        { kind: 'status', status: 'skillLock', turns: 1, target: 'allFoes', chance: 0.35 },
      ],
    },
  },

  // ───────── บทที่ 14 ก้อนเมฆหินอุกกาบาต ─────────
  meteorguard: {
    id: 'meteorguard', name: 'ยามหินอุกกาบาต', element: 'earth', mark: '☄️',
    stats: { hp: 40746, atk: 1724, def: 379, spd: 100, crit: 16 },
  },
  stoneserpent: {
    id: 'stoneserpent', name: 'งูศิลาโบราณ', element: 'earth', mark: '🐉',
    stats: { hp: 30117, atk: 1736, def: 382, spd: 140, crit: 22 },
    skill: {
      name: 'รัดกระแทกศิลา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'one' },
        { kind: 'status', status: 'stun', turns: 1, target: 'one', chance: 0.4 },
      ],
    },
  },
  quakebeast: {
    id: 'quakebeast', name: 'อสูรแผ่นดินไหว', element: 'earth', mark: '🦏',
    stats: { hp: 34545, atk: 1640, def: 361, spd: 92, crit: 14 },
    skill: {
      name: 'สั่นสะเทือนพิภพ', mp: 3,
      effects: [{ kind: 'damage', mult: 2.0, target: 'allFoes' }],
    },
  },
  cinderrock: {
    id: 'cinderrock', name: 'หินเถ้าถ่านลุกไหม้', element: 'fire', mark: '🪨',
    stats: { hp: 36317, atk: 1621, def: 357, spd: 116, crit: 18 },
    skill: {
      name: 'เถ้าถ่านแผดเผา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'burn', turns: 3, target: 'allFoes' },
      ],
    },
  },
  colossusmeteor: {
    id: 'colossusmeteor', name: 'มหากายอุกกาบาตล่มโลก', element: 'earth', mark: '🌠', boss: true,
    // เดิม def 1267/atk 2764 (สัดส่วน 0.46 ใกล้เคียงบอสบทอื่น) แต่จำลองแล้วทีมอ้างอิงตีไม่เข้า
    // สูตรลดทอนดาเมจ 100/(100+def) ทำให้ทนกว่าที่ค่าพลังรวม (combatPower) บอกไว้มาก จนสู้ไม่จบในเพดานรอบ
    // เหตุผลเดียวกับที่ต้องแก้ crystalgolem/skylord ตอนบทที่ 7-8 ย้ายส่วนของ def ไปเป็น atk แทน
    stats: { hp: 262191, atk: 3500, def: 700, spd: 108, crit: 20 },
    // ตอนจำลองแล้วทีมอ้างอิงยังโดนสตันหมู่ซ้ำจนตีไม่ทันเพดานรอบอยู่ดีทั้งที่ลดโอกาสแล้ว
    // (ลามไปถึงโหมดยาก/ปีศาจที่เลเวลอ้างอิงสูงกว่านี้มาก) ตัดสตันออกเหลือดาเมจล้วนเหมือนสันดวงเวิร์มบทที่ 3
    skill: {
      name: 'อุกกาบาตล้างพิภพ', mp: 3,
      effects: [{ kind: 'damage', mult: 2.4, target: 'allFoes' }],
    },
  },

  // ───────── บทที่ 15 เงาสะท้อนบัลลังก์โคลโน ─────────
  // บทสุดท้ายของเนื้อเรื่องตอนนี้ ผูกกับธีมจักรพรรดิโคลโน (ตัวละคร UR+ chronathar และตู้จักรพรรดิโคลโน)
  // บอสตัวนี้เป็นแค่ "เงาสะท้อน" ไม่ใช่ตัวละคร chronathar เอง เปิดทางไว้ให้เนื้อเรื่องต่อในอนาคต
  chronoguard: {
    id: 'chronoguard', name: 'ยามพิทักษ์กาลเวลา', element: 'dark', mark: '⏳',
    stats: { hp: 44820, atk: 1896, def: 417, spd: 112, crit: 18 },
  },
  timewraith: {
    id: 'timewraith', name: 'วิญญาณเวลาที่หลงทาง', element: 'dark', mark: '🕰️',
    stats: { hp: 33128, atk: 1910, def: 420, spd: 168, crit: 26 },
    skill: {
      name: 'บิดเบือนห้วงเวลา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'one' },
        { kind: 'mpDown', amount: 2, target: 'one' },
      ],
    },
  },
  echoknight: {
    id: 'echoknight', name: 'อัศวินเงาสะท้อน', element: 'dark', mark: '🪞',
    stats: { hp: 38000, atk: 1805, def: 397, spd: 138, crit: 22 },
    skill: {
      name: 'ดาบซ้อนเงา', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.6, target: 'one' },
        { kind: 'status', status: 'burn', turns: 2, target: 'one' },
      ],
    },
  },
  voidherald: {
    id: 'voidherald', name: 'ผู้ประกาศแห่งความว่างเปล่า', element: 'dark', mark: '📯',
    stats: { hp: 39949, atk: 1783, def: 392, spd: 120, crit: 18 },
    skill: {
      name: 'สังคายนาสูญญาการ', mp: 3,
      effects: [
        { kind: 'damage', mult: 1.5, target: 'allFoes' },
        { kind: 'status', status: 'skillLock', turns: 1, target: 'allFoes', chance: 0.3 },
      ],
    },
  },
  chronoshade: {
    id: 'chronoshade', name: 'เงาสะท้อนจักรพรรดิโคลโน', element: 'dark', mark: '👑', boss: true,
    // เดิม atk 3040/def 1393 (สัดส่วน 0.46) ผสมกับสามผลพร้อมกัน (ดาเมจหมู่+ลดพลังเวท+สตัน) จำลองแล้ว
    // ทีมอ้างอิงตีไม่เข้าและโดนล็อกจนสู้ไม่จบในเพดานรอบ เหตุผลเดียวกับ colossusmeteor ด้านบน
    // ย้ายส่วนของ def ไปเป็น atk แทน และลดความแรงของชุดสถานะลงเหลือผลเดียวที่หนักคือสตัน
    stats: { hp: 288410, atk: 3600, def: 650, spd: 130, crit: 24 },
    // ตอนจำลองแล้วทีมอ้างอิงยังโดนล็อกจนสู้ไม่ทันเพดานรอบอยู่ดี (เหตุผลเดียวกับ colossusmeteor ด้านบน)
    // ตัดสตันออก เหลือดาเมจหมู่กับลดพลังเวทซึ่งบั่นทอนแบบสะสม ไม่ใช่ล็อกไม่ให้ขยับตรง ๆ
    skill: {
      name: 'ล่วงกาลเงาจักรพรรดิ', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.2, target: 'allFoes' },
        { kind: 'mpDown', amount: 1, target: 'allFoes' },
      ],
    },
  },
}

export const FIRST_CLEAR_GEMS = 30

/**
 * เล่นด่านเนื้อเรื่องซ้ำ (ไม่ใช่ผ่านครั้งแรก) ก็ได้ค่าประสบการณ์ผู้เล่นด้วย แต่มีโควตารายวัน
 * กันไม่ให้ฟาร์มด่านเดียวรวดเดียวจบเกม ตามหลักที่ว่าเลเวลผู้เล่นต้องมาจากของจำกัดต่อวันเท่านั้น
 */
export const STORY_EXP_RUNS_PER_DAY = 15

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

  chapter(8, 'เหมืองคริสตัลใต้พิภพ', 'ลึกลงไปใต้นครลอยฟ้า มีบางอย่างเรืองแสงรออยู่', [
    { name: 'ปากถ้ำคริสตัล', intro: 'แสงเรืองรองพวยพุ่งออกมาจากปากถ้ำ ไม่รู้ว่าอยู่ลึกแค่ไหน', exp: 26000, enemies: [e('crystalgolem', 2), e('crystalgolem', 2)] },
    { name: 'อุโมงค์แร่เรืองแสง', intro: 'ผลึกเรืองแสงส่องทางไปเรื่อย ๆ แต่มีบางอย่างซ่อนอยู่ในเงา', exp: 28000, enemies: [e('gembat', 2), e('gembat', 2)] },
    { name: 'สายน้ำใต้ดิน', intro: 'น้ำใต้ดินไหลผ่านคริสตัลจนแวววาวไปทั้งอุโมงค์', exp: 30000, enemies: [e('shardwraith', 2), e('gembat', 3)] },
    { name: 'ห้องโถงคริสตัลยักษ์', intro: 'เสาคริสตัลสูงเท่าตึกเรียงรายทั่วห้องโถง', exp: 33000, enemies: [e('prismwyrm', 2), e('crystalgolem', 3)] },
    { name: 'ประตูสู่แก่นพิภพ', intro: 'ประตูสุดท้ายก่อนถึงแก่นโลก อย่าลงไปด้วยทีมที่บาดเจ็บ', exp: 36000, enemies: [e('shardwraith', 3), e('prismwyrm', 3), e('crystalgolem', 4)] },
    { name: 'แก่นคริสตัลนิรันดร์', intro: 'สิ่งที่หลับอยู่ใต้พิภพตื่นขึ้นพร้อมแสงจ้าจากแก่นคริสตัล', exp: 50000, enemies: [e('geodetitan', 4)] },
  ]),

  chapter(9, 'ทะเลสีเลือดใต้พสุธา', 'ลึกกว่าแก่นคริสตัลลงไปอีก มีทะเลที่ไม่ควรมีอยู่ใต้พิภพ', [
    { name: 'ชายฝั่งเลือดจาง', intro: 'น้ำสีแดงซัดเข้าฝั่งเป็นจังหวะ เหมือนมีอะไรหายใจอยู่ใต้นั้น', exp: 56000, enemies: [e('coralfang', 2), e('coralfang', 2)] },
    { name: 'แนวปะการังจมเลือด', intro: 'ปลิงตัวเล็กรวมฝูงกันจนดูเหมือนเงาเคลื่อนที่', exp: 60000, enemies: [e('leechswarm', 2), e('coralfang', 3)] },
    { name: 'ซากเรือใต้สมุทร', intro: 'อัศวินจมน้ำยังยืนเฝ้าซากเรือของตัวเองอยู่', exp: 64000, enemies: [e('tideknight', 2), e('leechswarm', 3)] },
    { name: 'หุบเหวก้นทะเล', intro: 'ปูยักษ์หนีบเรือทั้งลำให้จมได้ในไม่กี่วินาที', exp: 69000, enemies: [e('abysscrab', 2), e('tideknight', 3)] },
    { name: 'ประตูสู่ทะเลลึก', intro: 'ประตูสุดท้ายก่อนถึงตัวมัน อย่าลงไปด้วยทีมที่บาดเจ็บ', exp: 74000, enemies: [e('tideknight', 3), e('abysscrab', 3), e('leechswarm', 4)] },
    { name: 'ห้วงลึกแห่งวารีเลือด', intro: 'มันตื่นขึ้นจากก้นทะเล น้ำทั้งผืนกลายเป็นสีเลือดในพริบตา', exp: 100000, enemies: [e('crimsonleviathan', 4)] },
  ]),

  chapter(10, 'โรงหลอมเครื่องจักรโบราณ', 'เตาไฟที่ไม่เคยดับมาตั้งแต่ก่อนมีนครลอยฟ้า', [
    { name: 'ประตูเหล็กแดง', intro: 'ยามเหล็กยืนตรวจตราแม้ไม่มีใครสั่งการมันมานานแล้ว', exp: 63000, enemies: [e('forgesentry', 2), e('forgesentry', 2)] },
    { name: 'สายพานลาวา', intro: 'เฟืองหมุนไม่หยุดแม้พื้นโรงหลอมจะแตกร้าวไปทั่ว', exp: 68000, enemies: [e('moltengear', 2), e('forgesentry', 3)] },
    { name: 'ห้องเตาหลอมกลาง', intro: 'ประกายไฟลอยฟุ้งจนมองไม่เห็นทาง', exp: 73000, enemies: [e('sparkwraith', 2), e('moltengear', 3)] },
    { name: 'ศาลของผู้พิพากษา', intro: 'ที่นี่เคยตัดสินโทษคนงานที่ทำพลาด ตอนนี้ตัดสินทุกคนที่เข้ามา', exp: 78000, enemies: [e('ironjudge', 2), e('sparkwraith', 3)] },
    { name: 'ประตูแก่นเตาไฟ', intro: 'ประตูสุดท้ายก่อนถึงแก่นโรงหลอม อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 84000, enemies: [e('ironjudge', 3), e('moltengear', 4), e('sparkwraith', 4)] },
    { name: 'แก่นเตาไฟนิรันดร์', intro: 'ไททันที่หลอมตัวเองมานับพันปีลุกขึ้นจากเปลวไฟ', exp: 115000, enemies: [e('pyrotitan', 4)] },
  ]),

  chapter(11, 'ทุ่งสายลมไร้จุดจบ', 'ที่ราบสูงเหนือเมฆ ลมไม่เคยหยุดพัดแม้แต่วินาทีเดียว', [
    { name: 'หน้าผาต้นลม', intro: 'แร้งสายลมบินวนรอบหน้าผาราวกับรอบางอย่างตก', exp: 71000, enemies: [e('galeraptor', 2), e('galeraptor', 2)] },
    { name: 'ยอดเขาสายฟ้า', intro: 'เหยี่ยวสายฟ้าโฉบเร็วจนตามองแทบไม่ทัน', exp: 76000, enemies: [e('thunderhawk', 2), e('galeraptor', 3)] },
    { name: 'ทะเลเมฆ', intro: 'งูเมฆพรางตัวอยู่ในหมอกจนแยกไม่ออกว่าจริงหรือภาพลวงตา', exp: 82000, enemies: [e('cloudserpent', 2), e('thunderhawk', 3)] },
    { name: 'แท่นบูชากลางพายุ', intro: 'นักบวชพายุร่ายมนตร์เรียกลมมาช่วยตัวเองตลอดเวลา', exp: 88000, enemies: [e('stormpriest', 2), e('cloudserpent', 3)] },
    { name: 'ประตูสู่ตาพายุ', intro: 'ประตูสุดท้ายก่อนถึงใจกลางพายุ อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 94000, enemies: [e('stormpriest', 3), e('thunderhawk', 4), e('cloudserpent', 4)] },
    { name: 'ตาพายุนิรันดร์', intro: 'ใจกลางพายุที่ไม่เคยสงบ มีบางอย่างนั่งบัลลังก์อยู่ตรงนั้น', exp: 130000, enemies: [e('tempestarchon', 4)] },
  ]),

  chapter(12, 'มหาวิหารแสงจันทร์ขาว', 'วิหารลอยกลางฟากฟ้าที่แสงจันทร์ไม่เคยดับ', [
    { name: 'บันไดแสงจันทร์', intro: 'นักบวชจันทร์ขาวสวดมนต์อยู่ทุกขั้นบันได', exp: 80000, enemies: [e('moonpriest', 2), e('moonpriest', 2)] },
    { name: 'ระเบียงผู้พิทักษ์', intro: 'ผู้พิทักษ์ยืนนิ่งราวกับรูปปั้น จนกว่าจะมีใครเข้าใกล้', exp: 86000, enemies: [e('lightward', 2), e('moonpriest', 3)] },
    { name: 'ปีกวิหารด้านใน', intro: 'ปีกแสงกางออกจากเงามืดของเสาหินทุกต้น', exp: 92000, enemies: [e('seraphguard', 2), e('lightward', 3)] },
    { name: 'ห้องสมุดต้องห้าม', intro: 'อาลักษณ์เฝ้าคัมภีร์ที่ไม่อนุญาตให้ใครอ่าน', exp: 99000, enemies: [e('radiantscribe', 2), e('seraphguard', 3)] },
    { name: 'ประตูสู่แท่นบูชาจันทร์', intro: 'ประตูสุดท้ายก่อนถึงแท่นบูชา อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 106000, enemies: [e('radiantscribe', 3), e('lightward', 4), e('seraphguard', 4)] },
    { name: 'แท่นบูชาจันทร์เพ็ญ', intro: 'อัครทูตลืมตาขึ้นเป็นครั้งแรกในรอบพันปี', exp: 145000, enemies: [e('lunarchseraph', 4)] },
  ]),

  chapter(13, 'เขาวงกตเงาไร้ก้นบึ้ง', 'เขาวงกตที่สร้างจากเงาล้วน ไม่มีแผนที่ใดใช้ได้ที่นี่', [
    { name: 'ทางเข้าเขาวงกต', intro: 'นักล่าเงาซุ่มอยู่ทุกทางแยก', exp: 90000, enemies: [e('shadehunter', 2), e('shadehunter', 2)] },
    { name: 'ระเบียงผู้เก็บวิญญาณ', intro: 'ผู้เก็บวิญญาณเดินวนซ้ำเส้นทางเดิมไม่รู้จบ', exp: 96000, enemies: [e('wraithcollector', 2), e('shadehunter', 3)] },
    { name: 'ห้องไร้แสง', intro: 'ผู้สะกดรอยราตรีเคลื่อนไหวได้แม้ไม่มีแสงสักนิด', exp: 103000, enemies: [e('nightstalker', 2), e('wraithcollector', 3)] },
    { name: 'ลานอัศวินกลวง', intro: 'อัศวินที่ไม่มีใครอยู่ข้างในเกราะยังยืนถือดาบอยู่', exp: 110000, enemies: [e('hollowknight', 2), e('nightstalker', 3)] },
    { name: 'ประตูสู่แก่นเงา', intro: 'ประตูสุดท้ายก่อนถึงใจกลางเขาวงกต อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 118000, enemies: [e('hollowknight', 3), e('nightstalker', 4), e('wraithcollector', 4)] },
    { name: 'แก่นเงาสุญญาศูนย์', intro: 'จ้าวแห่งเงานั่งรออยู่ตรงนั้นมาตั้งแต่ก่อนเขาวงกตจะมีอยู่', exp: 160000, enemies: [e('voidsovereign', 4)] },
  ]),

  chapter(14, 'ก้อนเมฆหินอุกกาบาต', 'ก้อนหินลอยกลางฟ้าที่ร่วงลงมาจากที่ไหนสักแห่ง', [
    { name: 'พื้นผิวอุกกาบาต', intro: 'ยามหินยืนเฝ้าหลุมอุกกาบาตแต่ละหลุมอย่างเงียบงัน', exp: 100000, enemies: [e('meteorguard', 2), e('meteorguard', 2)] },
    { name: 'ถ้ำงูศิลา', intro: 'งูศิลารัดหินจนแตกเป็นผงได้ในไม่กี่วินาที', exp: 107000, enemies: [e('stoneserpent', 2), e('meteorguard', 3)] },
    { name: 'รอยแยกแผ่นดินไหว', intro: 'พื้นสั่นทุกครั้งที่อสูรตัวนั้นขยับ', exp: 115000, enemies: [e('quakebeast', 2), e('stoneserpent', 3)] },
    { name: 'ทุ่งเถ้าถ่านลุกไหม้', intro: 'หินที่ตกลงมาจากฟ้ายังร้อนจัดอยู่จนวันนี้', exp: 123000, enemies: [e('cinderrock', 2), e('quakebeast', 3)] },
    { name: 'ประตูสู่แก่นอุกกาบาต', intro: 'ประตูสุดท้ายก่อนถึงแก่นก้อนเมฆ อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 132000, enemies: [e('cinderrock', 3), e('quakebeast', 4), e('stoneserpent', 4)] },
    { name: 'แก่นอุกกาบาตล่มโลก', intro: 'มหากายที่หลับอยู่ในแก่นอุกกาบาตตื่นขึ้นพร้อมแรงสั่นสะเทือนทั้งก้อนเมฆ', exp: 180000, enemies: [e('colossusmeteor', 4)] },
  ]),

  chapter(15, 'เงาสะท้อนบัลลังก์โคลโน', 'ปลายทางของการเดินทางในตอนนี้ บัลลังก์ที่ไม่มีใครกล้าเข้าใกล้', [
    { name: 'ทางเข้าบัลลังก์', intro: 'ยามพิทักษ์กาลเวลายืนนิ่งราวกับหยุดเวลาตัวเองไว้', exp: 111000, enemies: [e('chronoguard', 2), e('chronoguard', 2)] },
    { name: 'ห้องโถงเวลาที่หลงทาง', intro: 'วิญญาณเวลาเดินวนซ้ำจุดเดิมไม่รู้จบ ราวกับติดอยู่ในรอบเดียวกันตลอดกาล', exp: 119000, enemies: [e('timewraith', 2), e('chronoguard', 3)] },
    { name: 'ระเบียงกระจกเงา', intro: 'อัศวินเงาสะท้อนออกมาจากกระจกทุกบานที่เดินผ่าน', exp: 127000, enemies: [e('echoknight', 2), e('timewraith', 3)] },
    { name: 'ลานประกาศศูนย์', intro: 'เสียงประกาศแห่งความว่างเปล่าดังก้องไปทั่วทั้งลาน', exp: 136000, enemies: [e('voidherald', 2), e('echoknight', 3)] },
    { name: 'ประตูสู่บัลลังก์', intro: 'ประตูสุดท้ายก่อนถึงบัลลังก์ อย่าเข้าไปด้วยทีมที่บาดเจ็บ', exp: 145000, enemies: [e('voidherald', 3), e('echoknight', 4), e('timewraith', 4)] },
    { name: 'เงาสะท้อนบนบัลลังก์โคลโน', intro: 'เงาที่สวมมงกุฎนั่งอยู่บนบัลลังก์ รอคอยใครสักคนมาพิสูจน์ตัวเองมานานแสนนาน', exp: 200000, enemies: [e('chronoshade', 4)] },
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

/**
 * บทเช็คพอยต์ที่ต้องผ่านด่านสุดท้ายให้ครบก่อนถึงจะปลดล็อกระดับความยากถัดไป
 *
 * ตรึงไว้ที่บทนี้เสมอ ไม่ใช่คำนวณจากด่านสุดท้ายที่มีอยู่จริงตอนนั้น (STAGES.length - 1)
 * เพราะถ้าผูกกับด่านสุดท้าย พอเพิ่มบทใหม่ต่อจากนี้เข้าไปใน CHAPTERS ระดับยาก/ปีศาจ
 * จะเลื่อนเงื่อนไขปลดล็อกตามไปด้วยทันทีโดยไม่ได้ตั้งใจ ทั้งที่อยากให้ปลดล็อกทันทีที่ผ่านบทนี้
 * ไม่ต้องรอผู้เล่นผ่านบทใหม่ ๆ ที่เพิ่งเพิ่มเข้ามาก่อน
 */
export const DIFFICULTY_GATE_CHAPTER = 7

export function difficultyGateStageId() {
  const ch = CHAPTERS[DIFFICULTY_GATE_CHAPTER - 1]
  return ch.stages[ch.stages.length - 1].id
}

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
/**
 * ส่วนต่อบทที่ 9-15 (2026): เพิ่มเนื้อเรื่องใหม่ต่อจากบทที่ 8
 *
 * โหมดยาก/ปีศาจ "เล่นซ้ำทุกบทเดิม" ด้วยตัวคูณที่สูงขึ้น (ดูหมายเหตุ STAGE_SCALE ด้านล่าง)
 * พอบทที่ 8 ไม่ใช่บทสุดท้ายอีกต่อไป โหมดยาก/ปีศาจก็ต้องเล่นซ้ำบทที่ 9-15 ด้วย และค่าพลังของ
 * "โหมดยาก บทที่ 1" ต้องแรงกว่า "โหมดปกติ บทที่ 15" เสมอ (ไม่งั้นไต่จบเนื้อเรื่องแล้วโหมดยากจะกลับง่ายลง)
 * บทที่ 9-15 ในตารางเดิมเลยไม่พอ ต้องคำนวณ TARGET_LEVEL/STAGE_SCALE ของโหมดยาก/ปีศาจใหม่ทั้งชุด
 * (บทที่ 1-4 ของโหมดยาก/ปีศาจเดิมก็ขยับตามไปด้วย เพราะสูตรเดียวกันต้องใช้ทีมอ้างอิงแรงขึ้นทุกบท)
 * โหมดปกติบทที่ 1-8 ไม่แตะ เพิ่มแค่บทที่ 9-15 ต่อท้าย
 */
export const TARGET_LEVEL = {
  normal: [5, 10, 18, 28, 38, 50, 60, 70, 82, 94, 106, 118, 130, 142, 154],
  hard: [205, 209, 213, 217, 221, 225, 229, 233, 237, 241, 245, 249, 253, 257, 261],
  demon: [275, 277, 279, 281, 283, 285, 287, 289, 291, 293, 295, 297, 299, 301, 303],
}

/**
 * ตัวคูณค่าพลังศัตรูของแต่ละบทในแต่ละโหมด
 *
 * ไม่ได้คิดจากสูตร แต่คำนวณจากค่าพลังทีมที่ผู้เล่นควรมีตอนนั้น
 * โดยตั้งให้ศัตรูอยู่ราว 0.5 เท่าของค่าพลังทีม ซึ่งเป็นจุดที่จำลองแล้วชนะได้แน่นอนภายในเพดานรอบ
 *
 * เดิมตั้งไว้ที่ 1.35 เท่า แต่ตอนนั้นไฟไหม้ไม่ผ่านสูตรลดทอนดาเมจด้วยพลังป้องกันเหมือนดาเมจอื่น
 * (ดู endOfTurn ใน battle.js) ทีมที่มีตัวติดไฟ (เช่นดราคอส) จึงเก็บบอสเลือดมหาศาลได้เร็วกว่าที่ควรมาก
 * ตัวเลข 1.35 เดิมจึงพึ่งพาไฟไหม้เกินจริงโดยไม่ได้ตั้งใจ พอแก้ให้ไฟไหม้โดนลดทอนด้วยพลังป้องกัน
 * เหมือนดาเมจตรง ทีมอ้างอิงเดิมสู้ไม่ทันเพดานรอบอีกต่อไปที่ 1.35 เท่า ต้องลดลงมาที่ 0.5 แทน
 * (ตัวเลขได้จากรันจำลองการต่อสู้จริงหาจุดที่ยังชนะได้แน่นอนในเพดานรอบ ไม่ใช่ตั้งลอย ๆ)
 *
 * โหมดปกติคงไว้ที่ 1 เกือบทั้งหมด เพราะปรับสมดุลด้วยการจำลองมาแล้ว
 * ยกเว้นบทที่ 7 ที่ลดลงให้ใช้ทีมเลเวล 60 แทน 70
 *
 * โหมดยากบทที่ 1 ตั้งให้แรงกว่าโหมดปกติบทสุดท้ายเล็กน้อยเสมอ (ดูหมายเหตุ TARGET_LEVEL ด้านบน
 * ตอนนี้คือบทที่ 15 หลังเพิ่มเนื้อเรื่องใหม่ ไม่ใช่บทที่ 7 เหมือนตอนมีแค่แปดบทอีกต่อไป) แล้วไล่ขึ้นต่อไปเอง
 * ตัวเลขจึงสูงมากในบทต้น ๆ ของโหมดยาก/ปีศาจ เพราะศัตรูบทที่ 1-4 มีค่าพลังพื้นฐานน้อย
 * ต้องคูณหลายสิบเท่าจึงจะเทียบเท่าบอสบทสุดท้ายของโหมดก่อนหน้า
 */
export const STAGE_SCALE = {
  // บทที่ 1 ถึง 4 ปรับด้วยมือจากการจำลอง เพราะผู้เล่นตอนนั้นยังไม่มีทีมครบห้าตัว
  // สูตรคำนวณจากทีมอ้างอิงใช้ไม่ได้ จะได้ตัวเลขที่คนเพิ่งเริ่มเล่นไม่มีทางผ่าน
  //
  // ตั้งแต่บทที่ 5 เป็นต้นไปของทุกโหมด คำนวณใหม่ทั้งชุดหลังแก้บั๊กไฟไหม้ (ดูหมายเหตุด้านบน)
  // บทที่ 8 (เหมืองคริสตัลใต้พิภพ) คำนวณด้วยวิธีเดียวกับบท 5-7 คือคูณ 0.5 เท่าของค่าพลังทีม
  //
  // ตอนเพิ่มบทที่ 8 เข้าไป บทแรกของโหมดยาก/ปีศาจ (ที่คำนวณจาก 0.5 เท่าของทีมอ้างอิงตรง ๆ)
  // อ่อนกว่าบอสบทสุดท้ายของโหมดก่อนหน้าไปเล็กน้อย เลยต้องขยับขึ้นให้พอดีกับบทสุดท้ายก่อนหน้า
  // (ต่างจากส่วนโค้ง 5-8 ในแต่ละโหมดที่ยังคำนวณตรงจากค่าพลังทีมล้วน ๆ ไม่ต้องขยับ)
  // บทที่ 9-15 ต่อด้วยสูตรเดียวกับบทที่ 5-8 (0.5 เท่าของค่าพลังทีมที่เลเวลใน TARGET_LEVEL.normal)
  normal: [
    1, 1, 0.75, 1.0, 1.1521, 0.3258, 0.3489, 0.3601, 0.3865, 0.3956, 0.3982, 0.3995, 0.3961,
    0.3765, 0.3737,
  ],

  // คำนวณใหม่ทั้งชุด 15 บท (ดูหมายเหตุ TARGET_LEVEL ด้านบน) ยังใช้สูตรเดียวกับก่อนหน้า
  // (0.5 เท่าของค่าพลังทีมอ้างอิงที่ TARGET_LEVEL ของแต่ละบท) บทแรกของแต่ละโหมดจึงต่อจาก
  // บทสุดท้ายของโหมดก่อนหน้าพอดีเหมือนเดิม เพียงแต่ตอนนี้ "บทสุดท้าย" คือบทที่ 15 ไม่ใช่บทที่ 8
  hard: [
    50.6751, 13.6441, 5.0965, 5.5635, 5.6135, 1.2946, 1.2079, 1.108, 1.0227, 0.9439, 0.8695,
    0.8032, 0.7405, 0.659, 0.6156,
  ],
  demon: [
    66.9607, 17.8387, 6.595, 7.1219, 7.1088, 1.6235, 1.4994, 1.3617, 1.2449, 1.1384, 1.0394,
    0.9514, 0.8697, 0.7673, 0.7107,
  ],
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
    enemies: [e('skeleton', 1), e('skeleton', 1)],
  },
  {
    id: 't-2', name: 'ลานฝึกชั้นกลาง', intro: 'คู่ซ้อมที่เอาจริงขึ้น เตรียมใจไว้หน่อย',
    training: true, exp: 200, requires: '1-5',
    enemies: [e('frostwolf', 1), e('hexer', 1), e('frostwolf', 1)],
  },
  {
    id: 't-3', name: 'ลานฝึกชั้นสูง', intro: 'ของจริงจากป่าหมอก ไม่ใช่หุ่นฟางแล้ว',
    training: true, exp: 520, requires: '2-4',
    enemies: [e('direboar', 3), e('mandrake', 3), e('sprite', 5)],
  },
  {
    id: 't-4', name: 'ลานฝึกยอดยุทธ์', intro: 'คู่ซ้อมระดับที่เจอในทะเลทราย',
    training: true, exp: 1200, requires: '3-4',
    enemies: [e('efreet', 1), e('mummy', 2), e('scorpion', 3)],
  },
  {
    id: 't-5', name: 'ลานฝึกเพลิงนิทรา', intro: 'ซ้อมกับของจริงจากยอดเขา',
    training: true, exp: 3000, requires: '4-4',
    enemies: [e('lavahound', 8), e('ashmage', 8), e('rocdrake', 8)],
  },
  {
    id: 't-6', name: 'ลานฝึกเงามืด', intro: 'ไม่มีอะไรให้ซ้อมนอกจากสิ่งที่เกือบฆ่าคุณได้',
    training: true, exp: 8000, requires: '5-4',
    enemies: [e('darkknight', 13), e('sentinel', 13), e('wraith', 14)],
  },
  {
    id: 't-7', name: 'ลานฝึกหุบเหว', intro: 'เสียงกรีดร้องที่ซ้อมจนชินแล้ว',
    training: true, exp: 20000, requires: '6-4',
    // เดิมสามตัว (บันชี1/ฮาร์ปี2/การ์กอยล์2) ค่าพลังรวมสูงกว่า t-8 ทั้งที่ t-8 อยู่บทถัดไป
    // เพราะมอนสเตอร์บทที่ 6 ไม่ได้ถูกลดทอนเหมือน t-8/t-9 (ดูหมายเหตุที่นั่น) แม้ลดเหลือเลเวล 1
    // ทั้งสามตัวก็ยังแรงกว่า t-8 อยู่ดี จึงตัดเหลือสองตัวแทนเพื่อให้เรียงค่าพลังถูกต้อง (t-6 < t-7 < t-8)
    enemies: [e('banshee', 1), e('gargoyle', 1)],
  },
  {
    id: 't-8', name: 'ลานฝึกนภา', intro: 'จักรกลที่ไม่รู้จักเหนื่อย เหมาะกับการซ้อมที่สุด',
    training: true, exp: 48000, requires: '7-4',
    // เดิมเลเวล 5 ทั้งสามตัว ตอนแก้บั๊กไฟไหม้เพิกเฉยพลังป้องกัน (ดู battle.js) ทีมอ้างอิงสู้ไม่ทัน
    // เพดานรอบเลย เพราะสามตัวรวมกันมีเลือด/ป้องกันดิบของบทที่ 7 อยู่แล้วโดยไม่มีตัวคูณลดทอนแบบด่านเนื้อเรื่อง
    // ลดลงมาเลเวล 2 ให้กลับมาผ่านได้สบายเหมือนลานฝึกอื่น
    enemies: [e('automaton', 2), e('seraph', 2), e('stormcaller', 2)],
  },
  {
    id: 't-9', name: 'ลานฝึกใต้พิภพ', intro: 'คริสตัลที่นี่แข็งกว่าที่คิด ใช้ซ้อมก่อนลงเหมืองจริง',
    training: true, exp: 90000, requires: '8-4',
    // เดิมเลเวล 1 ทั้งสามตัว ทำให้ค่าพลังต่ำกว่า t-8 ทั้งที่เป็นด่านสุดท้ายของลานฝึก
    // ขยับเป็นเลเวล 2 ให้ค่าพลังสูงกว่า t-8 จริง ยืนยันด้วยการจำลองแล้วว่ายังผ่านได้สบายในเพดานรอบ
    enemies: [e('crystalgolem', 2), e('shardwraith', 2), e('gembat', 2)],
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
    enemies: [e('golem', 1), e('skeleton', 1)],
  },
  {
    id: 'g-2', accountExp: 2000, name: 'เหมืองใต้รากไม้', intro: 'รากไม้ชอนไชจนผนังเหมืองแตก และมีอะไรตามเข้ามา',
    gemStage: true, gems: 110, exp: 220, requires: '2-4',
    enemies: [e('treant', 1), e('mandrake', 5), e('direboar', 5)],
  },
  {
    id: 'g-3', accountExp: 5000, name: 'เหมืองแก้วทะเลทราย', intro: 'ทรายหลอมเป็นแก้วจากความร้อนใต้ดิน',
    gemStage: true, gems: 180, exp: 620, requires: '3-4',
    // เดิม efreet อยู่เลเวล 2 คู่กับพญาหนอนเลเวล 1 ทำให้ทีมเลเวลแนะนำแพ้เกือบทุกครั้ง
    // (สกิลเผาเป็นวงกว้างของ efreet ซ้อนกับดาเมจหนักของบอสจนทีมเริ่มเกมพังก่อนจะฟื้นทัน)
    // ลดลงมาเลเวล 1 ให้เท่าฝั่งบอส ส่วนมัมมี่ยังเลเวล 2 ไว้ให้พอมีความหนืด
    enemies: [e('sandwyrm', 1), e('efreet', 1), e('mummy', 2)],
  },
  {
    id: 'g-4', accountExp: 12000, name: 'เหมืองแก่นภูเขาไฟ', intro: 'คริสตัลที่นี่ยังร้อนอยู่ และเจ้าของมันยังไม่ตาย',
    gemStage: true, gems: 280, exp: 1500, requires: '4-4',
    // เดิมเลเวล 6/8/8 ตอนแก้บั๊กไฟไหม้เพิกเฉยพลังป้องกัน (ดู battle.js) ทีมอ้างอิงสู้ไม่ทันเพดานรอบ
    // ลดลงมาให้ผ่านได้สบายเหมือนก่อนแก้บั๊ก
    enemies: [e('emberlord', 3), e('ashmage', 5), e('rocdrake', 5)],
  },
  {
    id: 'g-5', accountExp: 24000, name: 'คลังสมบัตินภา', intro: 'เมืองที่คนทิ้งไปแต่สมบัติยังอยู่',
    gemStage: true, gems: 480, exp: 9000, requires: '7-4',
    // เดิมเลเวล 9 ทั้งสามตัว ตอนแก้บั๊กไฟไหม้เพิกเฉยพลังป้องกัน (ดู battle.js) ทีมอ้างอิงสู้ไม่ทันเพดานรอบ
    enemies: [e('automaton', 1), e('seraph', 1), e('stormcaller', 1)],
  },
  {
    id: 'g-6', accountExp: 45000, name: 'แก่นเหมืองคริสตัล', intro: 'แก่นคริสตัลยังเรืองแสงอยู่ แม้เจ้าของมันจะล้มไปแล้ว',
    gemStage: true, gems: 800, exp: 16000, requires: '8-4',
    // geodetitan เป็นบอสบทที่ 8 ค่าพลังดิบแรงกว่าบอสด่านเก็บเพชรอื่นมาก (ด่านนี้ไม่ผ่าน
    // STAGE_SCALE เหมือนด่านเนื้อเรื่อง) ต้องลดทอนด้วย statScale ทีมอ้างอิงถึงจะสู้จบในเพดานรอบ
    // เดิมลดไว้ที่ 0.3 ทำให้ค่าพลังต่ำกว่า g-5 ทั้งที่เป็นด่านสุดท้ายของเหมืองคริสตัล
    // ขยับเป็น 0.42 ให้สูงกว่า g-5 จริง ยืนยันด้วยการจำลองแล้วว่ายังผ่านได้สบายในเพดานรอบ
    enemies: [
      { id: 'geodetitan', level: 1, statScale: 0.42 },
      { id: 'shardwraith', level: 1, statScale: 0.42 },
      { id: 'prismwyrm', level: 1, statScale: 0.42 },
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
