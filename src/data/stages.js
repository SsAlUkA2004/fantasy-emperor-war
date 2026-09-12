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
    stats: { hp: 3910, atk: 699, def: 146, spd: 106, crit: 16 },
  },
  mummy: {
    id: 'mummy', name: 'มัมมี่คำสาป', element: 'dark', mark: '🧟',
    stats: { hp: 6157, atk: 590, def: 218, spd: 62, crit: 6 },
  },
  efreet: {
    id: 'efreet', name: 'อิฟรีตทะเลทราย', element: 'fire', mark: '🕯️',
    stats: { hp: 4909, atk: 815, def: 159, spd: 98, crit: 12 },
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
    stats: { hp: 25792, atk: 991, def: 310, spd: 70, crit: 10 },
    skill: {
      name: 'กลืนทั้งเป็น', mp: 3,
      effects: [{ kind: 'damage', mult: 2.4, target: 'one' }],
    },
  },

  // ───────── บทที่ 4 ยอดเขาเพลิงนิทรา ─────────
  lavahound: {
    id: 'lavahound', name: 'สุนัขลาวา', element: 'fire', mark: '🐕',
    stats: { hp: 4472, atk: 593, def: 179, spd: 112, crit: 14 },
  },
  ashmage: {
    id: 'ashmage', name: 'นักเวทเถ้าถ่าน', element: 'fire', mark: '🌋',
    stats: { hp: 4004, atk: 681, def: 145, spd: 94, crit: 10 },
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
    stats: { hp: 5330, atk: 634, def: 208, spd: 120, crit: 15 },
  },
  emberlord: {
    id: 'emberlord', name: 'จอมเพลิงหลับใหล', element: 'fire', mark: '👹', boss: true,
    stats: { hp: 27300, atk: 889, def: 324, spd: 100, crit: 14 },
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
    stats: { hp: 5928, atk: 827, def: 202, spd: 128, crit: 20 },
  },
  darkknight: {
    id: 'darkknight', name: 'อัศวินดำ', element: 'dark', mark: '⚔️',
    stats: { hp: 8840, atk: 770, def: 344, spd: 92, crit: 12 },
    skill: {
      name: 'ดาบสาปแช่ง', mp: 3,
      effects: [{ kind: 'damage', mult: 2.2, target: 'one' }],
    },
  },
  sentinel: {
    id: 'sentinel', name: 'ผู้พิทักษ์แสงร้าง', element: 'light', mark: '🛡️',
    stats: { hp: 10140, atk: 686, def: 391, spd: 80, crit: 8 },
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
    stats: { hp: 46800, atk: 1139, def: 451, spd: 116, crit: 18 },
    skill: {
      name: 'กลืนกินแสงสุดท้าย', mp: 3,
      effects: [
        { kind: 'damage', mult: 2.1, target: 'allFoes' },
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
]

export const STAGES = CHAPTERS.flatMap((c) => c.stages)

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
    enemies: [e('efreet', 8), e('mummy', 9), e('scorpion', 10)],
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
    enemies: [e('sandwyrm', 2), e('efreet', 7), e('mummy', 7)],
  },
  {
    id: 'g-4', accountExp: 12000, name: 'เหมืองแก่นภูเขาไฟ', intro: 'คริสตัลที่นี่ยังร้อนอยู่ และเจ้าของมันยังไม่ตาย',
    gemStage: true, gems: 280, exp: 1500, requires: '4-4',
    enemies: [e('emberlord', 4), e('ashmage', 10), e('rocdrake', 10)],
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
