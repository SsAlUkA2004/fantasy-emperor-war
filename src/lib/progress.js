import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { FIRST_CLEAR_GEMS } from '../data/stages'

/**
 * บันทึกผลการผ่านด่าน
 *
 * เพชรจะเพิ่มเฉพาะครั้งแรกที่ผ่านด่านนั้น เล่นซ้ำได้แต่ไม่ได้เพชรอีก
 * Security Rules ตรวจสองอย่าง: เพชรเพิ่มได้ทีละ 30 พอดี
 * และ stageProgress ต้องมีคีย์ใหม่เพิ่มมาหนึ่งอันเท่านั้น
 *
 * ข้อจำกัดที่ยอมรับในเฟสนี้: กฎตรวจได้แค่ว่า "ตัวเลขสมเหตุสมผล"
 * แต่พิสูจน์ไม่ได้ว่าสู้จริง คนที่แก้โค้ดเองยังกดผ่านด่านโดยไม่เล่นได้
 * เพดานสูงสุดคือจำนวนด่านคูณ 30 ซึ่งเท่ากับที่เล่นจริงอยู่แล้ว
 * จะปิดช่องนี้สนิทต้องย้ายการคำนวณไปเซิร์ฟเวอร์ในเฟส 4
 */
export async function saveStageResult(player, stageId, stars) {
  const previous = player.stageProgress?.[stageId] ?? 0
  const firstClear = previous === 0

  if (!firstClear && stars <= previous) return { firstClear: false, gems: 0 }

  // เขียนทั้งก้อนแทนการใช้ field path แบบจุด
  // เพราะรหัสด่านอย่าง "1-1" ขึ้นต้นด้วยตัวเลขและมีขีดกลาง
  // ซึ่ง Firestore ไม่ยอมรับเป็น field path
  const patch = {
    stageProgress: {
      ...(player.stageProgress ?? {}),
      [stageId]: Math.max(previous, stars),
    },
  }

  if (firstClear) {
    patch.gems = player.gems + FIRST_CLEAR_GEMS
  }

  await updateDoc(doc(db, 'users', player.uid), patch)
  return { firstClear, gems: firstClear ? FIRST_CLEAR_GEMS : 0 }
}
