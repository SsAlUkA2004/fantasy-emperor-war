/**
 * แปลงข้อผิดพลาดจาก Firestore เป็นข้อความที่ตามต่อได้
 *
 * ก่อนหน้านี้ทุกที่เขียนว่า "ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง" เหมือนกันหมด
 * ซึ่งบอกอะไรไม่ได้เลยเวลาสาเหตุจริงเป็นอย่างอื่น และหาต้นตอไม่เจอ
 */
export function explainError(what, err) {
  const code = err?.code ?? ''

  if (code === 'permission-denied') {
    return `${what} เพราะกฎความปลอดภัยปฏิเสธคำขอ ให้เอาไฟล์ firestore.rules ล่าสุดไปวางใน Firebase Console แล้วกด Publish`
  }
  if (code === 'unavailable' || code === 'auth/network-request-failed') {
    return `${what} เพราะต่ออินเทอร์เน็ตไม่ได้`
  }
  if (code === 'failed-precondition') {
    return `${what} เพราะเงื่อนไขไม่ผ่าน (${err?.message ?? 'ไม่ทราบรายละเอียด'})`
  }
  if (code === 'not-found') return `${what} เพราะไม่พบข้อมูลที่ต้องใช้`
  if (err?.message) return `${what} — ${err.message}${code ? ` (${code})` : ''}`
  return `${what} (ไม่ทราบสาเหตุ)`
}
