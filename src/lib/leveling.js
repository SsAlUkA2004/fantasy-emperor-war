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
 * ค่าประสบการณ์ที่ต้องใช้เพื่อขึ้นจากเลเวลนี้ไปเลเวลถัดไป
 * เส้นโค้งเชิงเส้น ไม่ใช่ทวีคูณ เพราะเพดานสูงสุดอยู่ที่ 100
 * ถ้าใช้เส้นโค้งชันแบบเกมใหญ่ ผู้เล่นจะตันตั้งแต่เลเวล 20
 */
export function expToNext(level) {
  return 40 + (level - 1) * 22
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

export function playerExpToNext(level) {
  return 120 + (level - 1) * 55
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
