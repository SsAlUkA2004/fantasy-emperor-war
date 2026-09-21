import { CHARACTERS } from './characters'

// ─────────────────────────────────────────────────────────────
// ตู้จักรพรรดิโคลโน — ตู้กาชาใหม่ที่มีระดับความหายากสูงกว่า UR ขึ้นไปอีกขั้น (UR+)
//
// โครงสร้างเดียวกับตู้ UR (ดู urbanner.js) แต่มีสี่ระดับแทนที่จะเป็นสาม (SR/SSR/UR/UR+)
// และแยกกองตัวละครเป็นของตัวเอง ไม่ปนกับสิบเอ็ดตัวของตู้ UR เดิม
//
// ระดับ UR+ ไม่อยู่ใน RARITIES (R/SR/SSR) เหมือน UR เดิม เพราะไม่ใช่ปลายทางที่ตัวอื่น
// ไต่ขึ้นมาได้ ผลคือถูกกรองออกจากดันเจี้ยนรอยอดีตและหอแลกเปลี่ยนโดยอัตโนมัติเหมือน UR
// (ดู BY_RARITY ใน characters.js) — ระดับ UR/UR+ ต้องสุ่มจากตู้กาชาเท่านั้น
//
// ตัวระดับ SR/SSR แปดตัวในตู้นี้ไม่ได้ผูกขาด ยังแลกเปลี่ยนได้ตามปกติเหมือนตัวละครทั่วไป
// ระดับเดียวกัน มีแค่ระดับ UR/UR+ เท่านั้นที่ผูกขาดกับกาชา
// ─────────────────────────────────────────────────────────────

export const URPLUS_BANNER_IDS = {
  SR: ['emberlyn', 'coralek', 'terrawen', 'galewick'],
  SSR: ['tidalis', 'terragarde', 'lucerna', 'nocturael'],
  UR: ['seraphyx', 'ignatrix', 'zephyrion'],
  'UR+': ['chronathar'],
}

export const ALL_URPLUS_BANNER_IDS = [
  ...URPLUS_BANNER_IDS.SR,
  ...URPLUS_BANNER_IDS.SSR,
  ...URPLUS_BANNER_IDS.UR,
  ...URPLUS_BANNER_IDS['UR+'],
]

/** อัตราสุ่มต่อครั้ง ก่อนการันตี — ดูตัวนับการันตีสองชั้นใน lib/urplusgacha.js */
export const URPLUS_RATES = { SR: 0.75, SSR: 0.2485, UR: 0.001, 'UR+': 0.0005 }

/** กองตัวละครของตู้นี้ แบ่งตามระดับความหายาก รูปแบบเดียวกับ urBannerPool ในตู้ UR เดิม */
export function urPlusBannerPool() {
  return {
    SR: URPLUS_BANNER_IDS.SR.filter((id) => CHARACTERS[id]),
    SSR: URPLUS_BANNER_IDS.SSR.filter((id) => CHARACTERS[id]),
    UR: URPLUS_BANNER_IDS.UR.filter((id) => CHARACTERS[id]),
    'UR+': URPLUS_BANNER_IDS['UR+'].filter((id) => CHARACTERS[id]),
  }
}
