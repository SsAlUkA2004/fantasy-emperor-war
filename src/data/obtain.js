import { BANNERS, CHARACTERS, STARTER_IDS } from './characters'
import { EXCHANGE_COST, POOL_NAMES } from './exchange'
import { ALL_ELEMENTAL_IDS } from './elemental'
import { ALL_UR_BANNER_IDS } from './urbanner'
import { ALL_URPLUS_BANNER_IDS } from './urplusbanner'

// ─────────────────────────────────────────────────────────────
// แหล่งที่มาของตัวละครแต่ละตัว
//
// รวมไว้ที่เดียวเพราะข้อมูลนี้กระจายอยู่ในหลายไฟล์
// ทั้งรายชื่อในตู้กาชา ราคาแลกในหอแลกเปลี่ยน และการโผล่ในดันเจี้ยนรอยอดีต
// ถ้าให้หน้าจอไปรวบรวมเองทีละที่ พอเพิ่มแหล่งใหม่จะต้องไล่แก้ทุกหน้า
//
// ตัวละครตู้ธาตุหมุนเวียนและตู้ UR ระดับ UR ผูกขาดกับกาชา ไม่โผล่ในดันเจี้ยนรอยอดีต
// หรือหอแลกเปลี่ยนจริง (ดู chardungeon.js/lib/exchange.js) ต้องกรองออกที่นี่ด้วย
// ไม่งั้นหน้าจอจะโฆษณาแหล่งที่ไปหาไม่ได้จริง
// ─────────────────────────────────────────────────────────────

const elementalSet = new Set(ALL_ELEMENTAL_IDS)
const urExclusiveSet = new Set(
  [...ALL_UR_BANNER_IDS, ...ALL_URPLUS_BANNER_IDS].filter((id) => {
    const r = CHARACTERS[id]?.rarity
    return r === 'UR' || r === 'UR+'
  })
)

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
  if (elementalSet.has(charId)) {
    list.push({ kind: 'gacha', label: 'กาชา · ตู้ธาตุหมุนเวียน', to: '/gacha' })
  }
  if (ALL_UR_BANNER_IDS.includes(charId)) {
    list.push({ kind: 'gacha', label: 'กาชา · ตู้ UR', to: '/gacha' })
  }
  if (ALL_URPLUS_BANNER_IDS.includes(charId)) {
    list.push({ kind: 'gacha', label: 'กาชา · ตู้จักรพรรดิโคลโน', to: '/gacha' })
  }

  const exclusive = elementalSet.has(charId) || urExclusiveSet.has(charId)

  if (elementalSet.has(charId)) {
    list.push({
      kind: 'exchange',
      label: 'แลกชิ้นส่วนธาตุ (จากตัวซ้ำธาตุเดียวกัน) · ในหน้ากาชา ตู้ธาตุ',
      to: '/gacha',
    })
  } else if (!exclusive) {
    list.push({
      kind: 'exchange',
      label: `หอแลกเปลี่ยน · ${POOL_NAMES[c.rarity]} ${EXCHANGE_COST[c.rarity]} ชิ้น`,
      to: '/exchange',
    })
  }

  if (!exclusive) {
    list.push({
      kind: 'hunt',
      label: 'ดันเจี้ยนรอยอดีต · รอให้ถึงรอบของตัวนี้',
      to: '/hunt',
    })
  }

  return list
}
