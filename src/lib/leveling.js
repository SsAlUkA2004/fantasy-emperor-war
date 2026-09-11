export const RARITY_CAPS = {
  R: { base: 30, ascended: 50 },
  SR: { base: 50, ascended: 80 },
  SSR: { base: 75, ascended: 100 },
}

export const MAX_STAR = 5

/**
 * เพดานเลเวลของตัวละคร ขยับขึ้นตามจำนวนดาว
 * ดาว 1 ตันที่เพดานพื้นฐาน ดาว 5 ไปได้ถึงเพดานสูงสุดของระดับนั้น
 */
export function levelCap(rarity, star = 1) {
  const cap = RARITY_CAPS[rarity] ?? RARITY_CAPS.R
  const steps = MAX_STAR - 1
  const gain = (cap.ascended - cap.base) / steps
  return Math.round(cap.base + gain * (star - 1))
}

/**
 * ค่าประสบการณ์ของตัวละคร
 *
 * ใช้เส้นโค้งกำลัง 1.6 แทนเส้นตรง ไม่งั้นดันถึงเลเวล 100 ได้ในไม่กี่ชั่วโมง
 * รวมแล้วดัน SR ถึงเพดาน 50 ใช้ราว 118,000 หน่วย
 * และดัน SSR ถึง 100 ใช้ราว 722,000 หน่วย
 */
export function expToNext(level) {
  return Math.round(12 * Math.pow(level, 1.6))
}

export function gainExp(level, exp, amount, cap) {
  let lv = level
  let xp = (exp ?? 0) + amount
  let gained = 0

  while (lv < cap && xp >= expToNext(lv)) {
    xp -= expToNext(lv)
    lv += 1
    gained += 1
  }

  if (lv >= cap) xp = 0
  return { level: lv, exp: xp, gained }
}

// ───────── เลเวลของผู้เล่น ─────────

export const PLAYER_MAX_LEVEL = 100

/**
 * ค่าประสบการณ์ของผู้เล่น ตั้งใจให้ชันกว่าของตัวละครมาก
 *
 * สูตรคือ 40 × เลเวลยกกำลังสอง รวมแล้วถึงเลเวล 90 ต้องใช้ราว 9,560,000 หน่วย
 * เลเวลผู้เล่นจึงเป็นตัวบอกว่าเล่นมานานแค่ไหนจริง ๆ ไม่ใช่แค่ฟาร์มเก่ง
 *
 * ที่สำคัญกว่าตัวเลขคือแหล่งที่มา — ดูหมายเหตุใน progress.js
 * ค่าประสบการณ์ผู้เล่นได้จากของที่จำกัดต่อวันเท่านั้น ฟาร์มรวดเดียวไม่ได้
 */
export function playerExpToNext(level) {
  return 40 * level * level
}

export function gainPlayerExp(level, exp, amount) {
  let lv = level ?? 1
  let xp = (exp ?? 0) + amount
  let gained = 0

  while (lv < PLAYER_MAX_LEVEL && xp >= playerExpToNext(lv)) {
    xp -= playerExpToNext(lv)
    lv += 1
    gained += 1
  }

  if (lv >= PLAYER_MAX_LEVEL) xp = 0
  return { level: lv, exp: xp, gained }
}
