import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { GRADES, SLOT_IDS, rollGear } from '../data/gear'

const bag = (uid) => collection(db, 'users', uid, 'gear')

export async function loadGear(uid) {
  const snap = await getDocs(bag(uid))
  return snap.docs.map((d) => ({ id: d.id, plus: 0, ...d.data() }))
}

/** จัดกลุ่มอุปกรณ์ที่สวมอยู่ตามตัวละคร ใช้ตอนคำนวณค่าพลัง */
export function byCharacter(list = []) {
  const map = {}
  list.forEach((g) => {
    if (!g.equippedBy) return
    if (!map[g.equippedBy]) map[g.equippedBy] = []
    map[g.equippedBy].push(g)
  })
  return map
}

export async function addDrop(uid, source, ilvl) {
  const gear = rollGear(source, ilvl)
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  await setDoc(doc(bag(uid), id), {
    ...gear,
    source,
    equippedBy: null,
    obtainedAt: serverTimestamp(),
  })
  return { id, ...gear, source }
}

/**
 * สวมอุปกรณ์ให้ตัวละคร
 *
 * ถ้าช่องนั้นมีของอยู่แล้วจะถอดออกให้อัตโนมัติในคำสั่งเดียวกัน
 * ถ้าแยกเป็นสองคำสั่งแล้วเน็ตหลุดกลางทาง ตัวละครอาจใส่ของช่องเดียวกันสองชิ้น
 */
export async function equip(uid, gear, charId, current = []) {
  const clash = current.find((g) => g.equippedBy === charId && g.slot === gear.slot)

  const batch = writeBatch(db)
  if (clash && clash.id !== gear.id) {
    batch.update(doc(bag(uid), clash.id), { equippedBy: null })
  }
  batch.update(doc(bag(uid), gear.id), { equippedBy: charId })
  await batch.commit()
}

export async function unequip(uid, gearId) {
  await updateDoc(doc(bag(uid), gearId), { equippedBy: null })
}

/** ขายอุปกรณ์เป็นเหรียญ ของที่สวมอยู่ขายไม่ได้ */
export async function sell(player, gear) {
  if (gear.equippedBy) throw new Error('ต้องถอดออกก่อนจึงจะขายได้')
  const coins = (player.coins ?? 0) + GRADES[gear.grade].sell

  const batch = writeBatch(db)
  batch.delete(doc(bag(player.uid), gear.id))
  batch.update(doc(db, 'users', player.uid), { coins })
  await batch.commit()

  return { coins, gained: GRADES[gear.grade].sell }
}

export async function sellAll(player, list) {
  const sellable = list.filter((g) => !g.equippedBy)
  if (!sellable.length) throw new Error('ไม่มีของที่ขายได้')

  const gained = sellable.reduce((s, g) => s + GRADES[g.grade].sell, 0)
  const batch = writeBatch(db)
  sellable.forEach((g) => batch.delete(doc(bag(player.uid), g.id)))
  batch.update(doc(db, 'users', player.uid), { coins: (player.coins ?? 0) + gained })
  await batch.commit()

  return { count: sellable.length, gained }
}

export { SLOT_IDS }
