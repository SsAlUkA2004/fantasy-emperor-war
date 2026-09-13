import { BANNERS, CHARACTERS } from './characters'
import { EXCHANGE_COST, POOL_NAMES } from './exchange'
import { STARTER_IDS } from './characters'

// ─────────────────────────────────────────────────────────────
// แหล่งที่มาของตัวละครแต่ละตัว
//
// รวมไว้ที่เดียวเพราะข้อมูลนี้กระจายอยู่ในหลายไฟล์
// ทั้งรายชื่อในตู้กาชา ราคาแลกในหอแลกเปลี่ยน และการโผล่ในดันเจี้ยนรอยอดีต
// ถ้าให้หน้าจอไปรวบรวมเองทีละที่ พอเพิ่มแหล่งใหม่จะต้องไล่แก้ทุกหน้า
// ─────────────────────────────────────────────────────────────

export function sourcesFor(charId) {
  const c = CHARACTERS[charId]
  if (!c) return []

  const list = []

  if (STARTER_IDS.includes(charId)) {
    list.push({ kind: 'starter', label: 'เลือกได้ตอนเริ่มเกม' })
  }

  const banner = BANNERS.find((b) => b.ids.includes(charId))
  if (banner) {
    list.push({ kind: 'gacha', label: `กาชา · ${banner.name}`, to: '/gacha' })
  }

  list.push({
    kind: 'exchange',
    label: `หอแลกเปลี่ยน · ${POOL_NAMES[c.rarity]} ${EXCHANGE_COST[c.rarity]} ชิ้น`,
    to: '/exchange',
  })

  list.push({
    kind: 'hunt',
    label: 'ดันเจี้ยนรอยอดีต · รอให้ถึงรอบของตัวนี้',
    to: '/hunt',
  })

  return list
}
