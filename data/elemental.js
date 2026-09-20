import { CHARACTERS, ELEMENTS, RARITIES } from './characters'

// ─────────────────────────────────────────────────────────────
// ตู้กาชาธาตุหมุนเวียน
//
// แยกไฟล์จาก characters.js เพราะที่นี่มีแค่ตรรกะ "ตอนนี้ธาตุไหนเปิดอยู่"
// ตัวข้อมูลตัวละครหกสิบตัวยังอยู่ในออบเจ็กต์ CHARACTERS เดียวเหมือนตัวอื่นทุกตัว
// เพื่อให้ระบบอื่น (เลเวล ยกระดับ สนามรบ หอสะสม) ใช้งานตัวเหล่านี้ได้เหมือนตัวปกติทุกอย่าง
//
// ไม่เก็บ "ตอนนี้ธาตุไหนเปิด" ไว้ที่ไหนเลย เหมือนดันเจี้ยนหาตัวละคร (chardungeon.js)
// แต่คำนวณจากหมายเลขชั่วโมงด้วยสูตรเดิมทุกครั้ง ทุกเครื่องจึงเห็นธาตุตรงกันเสมอ
// โดยไม่ต้องมีเซิร์ฟเวอร์คอยหมุนเวียนให้
// ─────────────────────────────────────────────────────────────

const HOUR_MS = 60 * 60 * 1000

/** ลำดับการหมุนเวียนธาตุตามที่กำหนด ไล่ทีละชั่วโมงแล้ววนกลับมาเริ่มใหม่ */
export const ELEMENT_ORDER = ['fire', 'water', 'wind', 'earth', 'light', 'dark']

/** จำนวนตัวละครต่อธาตุ แบ่งตามระดับความหายาก */
export const SLOTS_PER_ELEMENT = { R: 3, SR: 3, SSR: 4 }

/** รหัสตัวละครหกสิบตัวของตู้ธาตุ แบ่งตามธาตุ ธาตุละสิบตัว */
export const ELEMENTAL_IDS = {
  fire: ['ignar', 'cindra', 'ashwen', 'pyrona', 'brandt', 'sunfira', 'vulkar', 'ignatia', 'magnor', 'emberia'],
  water: ['riplen', 'torrek', 'aqualin', 'marintha', 'coralun', 'brinelle', 'tsunar', 'naiadel', 'leviara', 'aquessa'],
  wind: ['gustan', 'aerdon', 'breezel', 'cyclona', 'tempes', 'windra', 'galehart', 'stormyx', 'aerielle', 'aerowyn'],
  earth: ['terrun', 'boulden', 'mossrik', 'granthe', 'stonewick', 'quarrin', 'titanis', 'gaiathe', 'monolir', 'terravon'],
  light: ['lumis', 'haloth', 'radia', 'solenne', 'gleamer', 'auralin', 'celestir', 'luminael', 'holyra', 'dawnessa'],
  dark: ['shadrin', 'gloomak', 'nightra', 'ravenor', 'duskren', 'moonfen', 'voidryn', 'abyxen', 'eclipsa', 'duskira'],
}

/** รวมทุกตัวในตู้ธาตุ ไม่แยกธาตุ ใช้ตรวจว่าตัวละครหนึ่งอยู่ในระบบนี้ไหม */
export const ALL_ELEMENTAL_IDS = ELEMENT_ORDER.flatMap((el) => ELEMENTAL_IDS[el])

/**
 * ชิ้นส่วนธาตุ — เศษวิญญาณกลางของตู้ธาตุ แยกเป็นคนละกองกับ shardPool ของตู้เดิม
 *
 * ซ้อนสองชั้น (ธาตุ → ระดับหายาก) เพราะได้ตัวซ้ำธาตุไหนก็ต้องใช้แลกได้แค่ธาตุนั้น
 * ไม่ใช่กองกลางเดียวข้ามธาตุแบบตู้เดิม ตามที่ตั้งใจให้ตู้ธาตุเป็นเศรษฐกิจแยกต่างหาก
 */
export const EMPTY_ELEM_POOL = ELEMENT_ORDER.reduce((acc, el) => {
  acc[el] = { R: 0, SR: 0, SSR: 0 }
  return acc
}, {})

export function elementalHourIndex(date = new Date()) {
  return Math.floor(date.getTime() / HOUR_MS)
}

export function elementalHourStartsAt(hour) {
  return new Date(hour * HOUR_MS)
}

/** เหลือเวลาอีกกี่นาทีก่อนธาตุจะเปลี่ยน */
export function elementalMinutesLeft(hour = elementalHourIndex()) {
  return Math.max(0, Math.ceil((elementalHourStartsAt(hour + 1).getTime() - Date.now()) / 60000))
}

/** ธาตุที่เปิดอยู่ตอนนี้ ไล่ตามลำดับ ELEMENT_ORDER แล้ววนซ้ำทุกหกชั่วโมง */
export function activeElement(hour = elementalHourIndex()) {
  const index = ((hour % ELEMENT_ORDER.length) + ELEMENT_ORDER.length) % ELEMENT_ORDER.length
  return ELEMENT_ORDER[index]
}

/** ตารางล่วงหน้า ใช้วางแผนว่าจะเข้ามาสุ่มธาตุไหนตอนไหน */
export function elementalSchedule(hours = 6, from = elementalHourIndex()) {
  return Array.from({ length: hours + 1 }, (_, i) => ({
    hour: from + i,
    element: activeElement(from + i),
  }))
}

/** กองตัวละครของธาตุที่เปิดอยู่ แบ่งตามระดับความหายาก รูปแบบเดียวกับ bannerPool ในตู้ปกติ */
export function elementalPool(element = activeElement()) {
  const ids = ELEMENTAL_IDS[element] ?? []
  return RARITIES.reduce((acc, r) => {
    acc[r] = ids.filter((id) => CHARACTERS[id]?.rarity === r)
    return acc
  }, {})
}

export function elementLabel(element) {
  return ELEMENTS[element]?.name ?? element
}

export function elementMark(element) {
  return ELEMENTS[element]?.mark ?? ''
}
