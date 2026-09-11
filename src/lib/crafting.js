import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import {
  EMPTY_BAG,
  MATERIAL_IDS,
  SHOP,
  canAfford,
  skillUpgradeCost,
} from '../data/materials'

/**
 * ซื้อของจากร้าน
 * ราคาทั้งหมดอ่านจากรายการ SHOP ซึ่งกฎฝั่งเซิร์ฟเวอร์ก็ตรวจตัวเลขชุดเดียวกัน
 */
export async function buy(player, skuId) {
  const sku = SHOP.find((s) => s.id === skuId)
  if (!sku) throw new Error('ไม่พบสินค้านี้')
  if (player.gems < sku.price) throw new Error('เพชรไม่พอ')

  const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }
  bag[sku.material] = (bag[sku.material] ?? 0) + sku.amount

  await updateDoc(doc(db, 'users', player.uid), {
    gems: player.gems - sku.price,
    materials: bag,
  })

  return { material: sku.material, amount: sku.amount, price: sku.price }
}

/**
 * ดันระดับสกิลของตัวละครหนึ่งตัว
 *
 * เขียนสองที่ จึงใช้ batch เพื่อให้หักของกับเพิ่มระดับสำเร็จหรือล้มพร้อมกัน
 * ถ้าเน็ตหลุดกลางทางแล้วสำเร็จแค่ครึ่งเดียว ผู้เล่นจะเสียของฟรีหรือได้ของฟรี
 */
export async function upgradeSkill(player, entry) {
  const level = entry.skillLevel ?? 1
  const cost = skillUpgradeCost(level)
  if (!cost) throw new Error('สกิลเต็มระดับแล้ว')

  const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }
  if (!canAfford(bag, cost)) throw new Error('วัสดุไม่พอ')

  MATERIAL_IDS.forEach((id) => {
    bag[id] = (bag[id] ?? 0) - (cost[id] ?? 0)
  })

  const batch = writeBatch(db)
  batch.update(doc(db, 'users', player.uid), { materials: bag })
  batch.update(doc(db, 'users', player.uid, 'collection', entry.id), {
    skillLevel: level + 1,
  })
  await batch.commit()

  return { skillLevel: level + 1, bag, spent: cost }
}
