export const MAX_LEVEL = 30

/**
 * ค่าประสบการณ์ที่ต้องใช้เพื่อขึ้นจากเลเวลนี้ไปเลเวลถัดไป
 * เส้นโค้งเป็นเชิงเส้น ไม่ใช่ทวีคูณ เพราะเกมมีแค่หกด่าน
 * ถ้าใช้เส้นโค้งชันแบบเกมใหญ่ ผู้เล่นจะตันตั้งแต่เลเวล 5
 */
export function expToNext(level) {
  if (level >= MAX_LEVEL) return Infinity
  return 50 + (level - 1) * 35
}

/**
 * ใส่ค่าประสบการณ์เข้าไปแล้วคืนเลเวลกับเศษที่เหลือ
 * รองรับการขึ้นหลายเลเวลรวดเดียวจากการเก็บด่านยาก ๆ
 */
export function gainExp(level, exp, amount) {
  let lv = level
  let xp = (exp ?? 0) + amount
  let gained = 0

  while (lv < MAX_LEVEL && xp >= expToNext(lv)) {
    xp -= expToNext(lv)
    lv += 1
    gained += 1
  }

  if (lv >= MAX_LEVEL) xp = 0

  return { level: lv, exp: xp, gained }
}
