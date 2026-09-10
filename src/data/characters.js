// ─────────────────────────────────────────────────────────────
// ข้อมูลตัวละครทั้งหมดอยู่ในโค้ด ไม่ได้อยู่ใน Firestore
//
// ตอนเขียนเอกสารออกแบบผมวางไว้ว่าจะเก็บใน Firestore แต่พอลงมือทำจริงแล้วคิดใหม่
// ข้อมูลชุดนี้เหมือนกันสำหรับผู้เล่นทุกคนและไม่เคยเปลี่ยนระหว่างเล่น
// ถ้าเก็บใน Firestore ผู้เล่นทุกคนต้องเสียโควตาอ่านทุกครั้งที่เปิดเกม
// เพื่อโหลดของที่เหมือนกันเป๊ะ ทั้งที่ฝังมากับไฟล์ JS ไปเลยก็ได้ฟรี ๆ
//
// Firestore เก็บเฉพาะ "ผู้เล่นคนนี้มีตัวไหน เลเวลเท่าไหร่" ซึ่งต่างกันไปแต่ละคน
// เวลาปรับสมดุลก็แก้ไฟล์นี้แล้ว push ระบบดีพลอยรันเองในหนึ่งนาที
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

export const CHARACTERS = {
  athen: {
    id: 'athen',
    name: 'อาเธน',
    epithet: 'นักดาบเปลวอัคนี',
    rarity: 'SR',
    element: 'fire',
    role: 'striker',
    starter: true,
    stats: { hp: 820, atk: 165, def: 55, spd: 105, crit: 15 },
    skill: {
      name: 'ฟันเพลิงคำราม',
      mp: 3,
      desc: 'โจมตีเดี่ยว 180% และทำให้เป้าหมายติดไฟ 2 เทิร์น',
    },
    ultimate: {
      name: 'อัคนีมหาประลัย',
      desc: 'โจมตีเดี่ยว 400% ถ้าเป้าหมายติดไฟอยู่ ดาเมจคูณอีก 1.5 เท่า',
    },
    blurb: 'เลือดน้อยแต่ต่อยหนักที่สุดในสามคน เหมาะกับคนที่ชอบจบเกมเร็ว',
  },
  galen: {
    id: 'galen',
    name: 'กาเลน',
    epithet: 'อัศวินโล่ศิลา',
    rarity: 'SR',
    element: 'earth',
    role: 'guardian',
    starter: true,
    stats: { hp: 1400, atk: 95, def: 120, spd: 72, crit: 5 },
    skill: {
      name: 'กำแพงปฐพี',
      mp: 3,
      desc: 'ดึงเป้าโจมตีมาที่ตัวเอง 2 เทิร์น และเพิ่มพลังป้องกันตัวเอง 50%',
    },
    ultimate: {
      name: 'ปฐพีสั่นสะเทือน',
      desc: 'โจมตีศัตรูทุกตัว 150% และมีโอกาสครึ่งหนึ่งทำให้สตัน 1 เทิร์น',
    },
    blurb: 'อึดที่สุด ล้มยากมาก แต่กว่าจะฆ่าใครได้ต้องใช้หลายเทิร์น',
  },
  lumina: {
    id: 'lumina',
    name: 'ลูมินา',
    epithet: 'นักบวชแสงจันทร์',
    rarity: 'SR',
    element: 'light',
    role: 'mystic',
    starter: true,
    stats: { hp: 950, atk: 88, def: 70, spd: 90, crit: 8 },
    skill: {
      name: 'พรจันทรา',
      mp: 3,
      desc: 'ฟื้นพลังชีวิตเพื่อนที่เลือดน้อยที่สุด 30% และล้างสถานะติดลบ',
    },
    ultimate: {
      name: 'ม่านแสงศักดิ์สิทธิ์',
      desc: 'ฟื้นพลังทั้งทีม 25% และให้เกราะกันดาเมจหนึ่งครั้ง',
    },
    blurb: 'ตัวเองบอบบาง แต่ทำให้ทั้งทีมอยู่รอดได้นานกว่าที่ควรจะเป็น',
  },
}

export const STARTER_IDS = Object.values(CHARACTERS)
  .filter((c) => c.starter)
  .map((c) => c.id)

export const STARTING_GEMS = 500

export function getCharacter(id) {
  return CHARACTERS[id] ?? null
}
