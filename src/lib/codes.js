import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * แลกโค้ดรับเพชร
 *
 * ความปลอดภัยอยู่ที่ Security Rules ไม่ใช่โค้ดนี้
 * กฎจะอ่านเอกสารโค้ดเองแล้วตรวจสามอย่าง
 *   1. เพชรที่เพิ่มต้องเท่ากับที่เขียนไว้ในเอกสารโค้ดเป๊ะ
 *   2. โค้ดต้องยังเปิดใช้งานและยังไม่หมดอายุ
 *   3. รหัสโค้ดต้องยังไม่อยู่ในรายการที่ผู้เล่นคนนี้เคยแลก
 * ผู้เล่นจึงแก้จำนวนเพชรเองไม่ได้ และแลกโค้ดเดิมซ้ำไม่ได้
 *
 * ข้อจำกัด: จำกัดจำนวนคนที่แลกได้ทั้งหมด (maxUses) ยังทำไม่ได้ฝั่งนี้
 * เพราะต้องนับรวมข้ามผู้เล่น ต้องรอฟังก์ชันฝั่งเซิร์ฟเวอร์
 */
export async function redeemCode(player, rawCode) {
  const code = rawCode.trim().toUpperCase()
  if (!code) throw new Error('ยังไม่ได้กรอกโค้ด')

  const already = player.redeemed ?? []
  if (already.includes(code)) throw new Error('โค้ดนี้แลกไปแล้ว')

  const snap = await getDoc(doc(db, 'codes', code))
  if (!snap.exists()) throw new Error('ไม่พบโค้ดนี้ ลองตรวจตัวสะกดอีกครั้ง')

  const data = snap.data()
  if (data.active === false) throw new Error('โค้ดนี้ถูกปิดไปแล้ว')
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) throw new Error('โค้ดนี้หมดอายุแล้ว')

  await updateDoc(doc(db, 'users', player.uid), {
    gems: player.gems + data.gems,
    redeemed: [...already, code],
    lastCode: code,
  })

  return { gems: data.gems, label: data.label ?? null }
}
