import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { invalidateRoster } from './rostercache'
import { GRADE_IDS, SLOT_IDS, rollSubstats } from '../data/gear'
import { CHARACTERS } from '../data/characters'
import { SHARDS_PER_DUPE } from '../data/exchange'

/**
 * แลกโค้ดรับเพชร/อุปกรณ์/ตัวละคร
 *
 * ความปลอดภัยอยู่ที่ Security Rules ไม่ใช่โค้ดนี้
 * กฎจะอ่านเอกสารโค้ดเองแล้วตรวจสามอย่าง
 *   1. เพชรที่เพิ่มต้องเท่ากับที่เขียนไว้ในเอกสารโค้ดเป๊ะ
 *   2. โค้ดต้องยังเปิดใช้งานและยังไม่หมดอายุ
 *   3. รหัสโค้ดต้องยังไม่อยู่ในรายการที่ผู้เล่นคนนี้เคยแลก
 * ผู้เล่นจึงแก้จำนวนเพชรเองไม่ได้ และแลกโค้ดเดิมซ้ำไม่ได้
 *
 * อุปกรณ์ที่แจกผ่านโค้ดสร้างเป็นเอกสารในคลังของผู้เล่นตามกฎเดียวกับของที่ดรอปจริง
 * (ช่อง/เกรด/ระดับไอเทมต้องมีอยู่จริงและตีบวกเป็นศูนย์) กฎจึงไม่ต้องแก้เพิ่ม
 *
 * ตัวละครที่แจกผ่านโค้ดก็เช่นกัน — เริ่มที่เลเวล 1 ดาว 1 เสมอตามกฎเดียวกับตัวที่ได้จากกาชา
 * ถ้าผู้เล่นมีตัวนั้นอยู่แล้วจะได้ชิ้นส่วนแทน (เท่ากับตัวซ้ำหนึ่งตัวตามระดับความหายาก)
 * ไม่ได้ตัวซ้ำเปล่า ๆ โดยไม่ได้อะไรกลับมา
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

  const gems = data.gems ?? 0
  const gearSpecs = Array.isArray(data.gear) ? data.gear : []
  const charIds = Array.isArray(data.characters) ? data.characters : []

  const batch = writeBatch(db)
  batch.update(doc(db, 'users', player.uid), {
    gems: player.gems + gems,
    redeemed: [...already, code],
    lastCode: code,
  })

  let gearCount = 0
  gearSpecs.forEach((spec) => {
    if (!SLOT_IDS.includes(spec.slot) || !GRADE_IDS.includes(spec.grade)) return
    const ilvl = Math.max(1, Math.min(5, Math.round(spec.ilvl ?? 1)))
    const count = Math.max(1, Math.min(20, Math.round(spec.count ?? 1)))

    for (let i = 0; i < count; i++) {
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
      batch.set(doc(collection(db, 'users', player.uid, 'gear'), id), {
        slot: spec.slot,
        grade: spec.grade,
        ilvl,
        plus: 0,
        equippedBy: null,
        source: 'code',
        substats: rollSubstats(spec.grade, spec.slot),
        obtainedAt: serverTimestamp(),
      })
      gearCount += 1
    }
  })

  // ตัวละคร: เช็คทีละตัวว่ามีอยู่แล้วหรือยัง เพราะการมีอยู่แล้วเปลี่ยนพฤติกรรม (ตัวใหม่ vs ชิ้นส่วน)
  const newChars = []
  const shardChars = []
  for (const charId of charIds) {
    const char = CHARACTERS[charId]
    if (!char) continue

    const charRef = doc(db, 'users', player.uid, 'collection', charId)
    const ownedSnap = await getDoc(charRef)

    if (!ownedSnap.exists()) {
      batch.set(charRef, {
        level: 1,
        exp: 0,
        star: 1,
        shards: 0,
        skillLevel: 1,
        tier: 0,
        awaken: 0,
        obtainedAt: serverTimestamp(),
      })
      newChars.push(char.name)
    } else {
      const gain = SHARDS_PER_DUPE[char.rarity] ?? 0
      batch.update(charRef, { shards: (ownedSnap.data().shards ?? 0) + gain })
      shardChars.push({ name: char.name, shards: gain })
    }
  }

  await batch.commit()
  if (gearCount > 0 || charIds.length > 0) invalidateRoster()

  return { gems, gearCount, newChars, shardChars, label: data.label ?? null }
}
