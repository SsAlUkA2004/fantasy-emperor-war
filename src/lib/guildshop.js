import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { GUILD_SHOP } from '../data/guildshop'
import { EMPTY_BAG, MATERIAL_IDS } from '../data/materials'
import { EMPTY_POOL } from '../data/exchange'
import { rollGear } from '../data/gear'

/**
 * ซื้อของจากร้านค้ากิลด์
 *
 * จ่ายด้วยเหรียญกิลด์เท่านั้น ซึ่งได้จากกิลด์เรดอย่างเดียว
 * จึงเป็นเหตุผลให้สมาชิกกลับมาตีบอสกิลด์ทุกสัปดาห์
 */
export async function buyGuildItem(player, itemId) {
  const item = GUILD_SHOP.find((i) => i.id === itemId)
  if (!item) throw new Error('ไม่พบสินค้านี้')
  if ((player.guildCoins ?? 0) < item.price) throw new Error('เหรียญกิลด์ไม่พอ')

  const batch = writeBatch(db)
  const patch = { guildCoins: (player.guildCoins ?? 0) - item.price }
  let got = null

  if (item.kind === 'gear') {
    const gear = rollGear('guild', item.ilvl)
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
    batch.set(doc(db, 'users', player.uid, 'gear', id), {
      ...gear,
      source: 'guild',
      equippedBy: null,
      obtainedAt: serverTimestamp(),
    })
    got = { kind: 'gear', gear }
  } else if (item.kind === 'material') {
    const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }
    bag[item.material] = (bag[item.material] ?? 0) + item.amount
    patch.materials = bag
    got = { kind: 'material', material: item.material, amount: item.amount }
  } else if (item.kind === 'pool') {
    const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
    pool[item.rarity] = (pool[item.rarity] ?? 0) + item.amount
    patch.shardPool = pool
    got = { kind: 'pool', rarity: item.rarity, amount: item.amount }
  }

  batch.update(doc(db, 'users', player.uid), patch)
  await batch.commit()

  return got
}

export { MATERIAL_IDS }
