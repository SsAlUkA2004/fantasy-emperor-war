import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { ENEMIES } from '../data/stages'
import { ALL_BOSS_SPECS } from '../data/worldboss'
import { entryPower } from './power'
import { hasAdvantage } from './stats'

// ─────────────────────────────────────────────────────────────
// ตัวแนะนำทีม
//
// อ่านศัตรูของด่านแล้วให้คะแนนตัวละครที่ผู้เล่นมี ว่าตัวไหนน่าจะช่วยได้มากที่สุด
// คะแนนมาจากสามอย่าง คือได้เปรียบธาตุ บทบาทตรงกับรูปแบบด่าน และค่าพลังดิบ
//
// ตั้งใจให้เป็นคำแนะนำ ไม่ใช่คำตอบตายตัว
// เพราะการจัดทีมที่ดีขึ้นกับหลายอย่างที่ตัวเลขวัดไม่ได้ เช่นจังหวะการใช้ท่าไม้ตาย
// ─────────────────────────────────────────────────────────────

/** ดึงข้อมูลศัตรูออกมาไม่ว่ามันจะอยู่ตารางไหน */
function resolveFoe(entry) {
  const id = entry.id
  if (typeof id === 'string' && id.startsWith('boss:')) {
    return ALL_BOSS_SPECS.find((b) => b.id === id.slice(5)) ?? null
  }
  if (typeof id === 'string' && id.startsWith('hero:')) {
    return CHARACTERS[id.slice(5)] ?? null
  }
  return ENEMIES[id] ?? null
}

export function readStage(stage) {
  const foes = (stage?.enemies ?? []).map(resolveFoe).filter(Boolean)
  const elements = {}
  foes.forEach((f) => {
    elements[f.element] = (elements[f.element] ?? 0) + 1
  })

  const isBoss = foes.some((f) => f.boss) || foes.length === 1
  return { foes, elements, count: foes.length, isBoss }
}

/** ตัวละครตัวนี้มีท่าที่โดนทั้งแถวไหม */
function hasAoe(char) {
  const all = [...(char.skill?.effects ?? []), ...(char.ultimate?.effects ?? [])]
  return all.some((e) => e.kind === 'damage' && e.target === 'allFoes')
}

function hasHeal(char) {
  const all = [...(char.skill?.effects ?? []), ...(char.ultimate?.effects ?? [])]
  return all.some((e) => e.kind === 'heal')
}

function hasBigSingle(char) {
  const all = [...(char.skill?.effects ?? []), ...(char.ultimate?.effects ?? [])]
  return all.some((e) => e.kind === 'damage' && e.target === 'one' && e.mult >= 3)
}

/**
 * ให้คะแนนตัวละครหนึ่งตัวกับด่านหนึ่งด่าน
 * คืนคะแนนกับเหตุผล เพื่อให้ผู้เล่นเห็นว่าทำไมถึงแนะนำตัวนี้
 */
export function scoreFor(entry, info) {
  const c = CHARACTERS[entry.id]
  if (!c) return null

  const reasons = []
  let mult = 1

  // ได้เปรียบธาตุ คิดตามสัดส่วนศัตรูที่เราตีแรงใส่
  const beats = Object.entries(info.elements).filter(([el]) => hasAdvantage(c.element, el))
  const beaten = Object.entries(info.elements).filter(([el]) => hasAdvantage(el, c.element))
  const beatCount = beats.reduce((s, [, n]) => s + n, 0)
  const beatenCount = beaten.reduce((s, [, n]) => s + n, 0)

  if (beatCount > 0) {
    mult += 0.35 * (beatCount / info.count)
    reasons.push(`ตีแรงใส่ ${beats.map(([el]) => ELEMENTS[el].name).join(' ')}`)
  }
  if (beatenCount > 0) {
    mult -= 0.25 * (beatenCount / info.count)
    reasons.push(`โดน ${beaten.map(([el]) => ELEMENTS[el].name).join(' ')} ตีแรงใส่`)
  }

  // บทบาทตรงกับรูปแบบด่าน
  if (info.count >= 3 && hasAoe(c)) {
    mult += 0.3
    reasons.push('มีท่าโดนทั้งแถว')
  }
  if (info.isBoss && hasBigSingle(c)) {
    mult += 0.3
    reasons.push('ดาเมจต่อเป้าหมายเดียวสูง')
  }
  if (info.isBoss && hasHeal(c)) {
    mult += 0.2
    reasons.push('ฟื้นพลังได้ ช่วยยืนระยะยาว')
  }
  if (info.isBoss && c.role === 'guardian') {
    mult += 0.2
    reasons.push('ยืนรับแทนเพื่อนได้')
  }

  return { entry, char: c, score: Math.round(entryPower(entry) * Math.max(0.3, mult)), reasons }
}

/** จัดอันดับตัวละครที่มีทั้งหมดสำหรับด่านนี้ */
export function rankRoster(roster = [], stage) {
  const info = readStage(stage)
  return roster
    .map((e) => scoreFor(e, info))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
}

/** คำแนะนำภาพรวมของด่าน เป็นประโยคสั้น ๆ */
export function stageTips(stage) {
  const info = readStage(stage)
  const tips = []

  const elementNames = Object.entries(info.elements)
    .sort((a, b) => b[1] - a[1])
    .map(([el, n]) => `${ELEMENTS[el].mark} ${ELEMENTS[el].name}${n > 1 ? ` ${n} ตัว` : ''}`)
  if (elementNames.length) tips.push(`ศัตรูเป็นธาตุ ${elementNames.join(' · ')}`)

  // ธาตุที่ได้เปรียบ คำนวณย้อนกลับจากธาตุของศัตรู
  const good = Object.keys(ELEMENTS).filter((el) =>
    Object.keys(info.elements).some((foe) => hasAdvantage(el, foe))
  )
  if (good.length) {
    tips.push(`พาตัวธาตุ ${good.map((el) => ELEMENTS[el].name).join(' หรือ ')} ไปจะตีแรงขึ้น 30%`)
  }

  if (info.count >= 3) tips.push('ศัตรูมาหลายตัว ตัวที่มีท่าโดนทั้งแถวจะจบเร็วกว่ามาก')
  if (info.isBoss) tips.push('เจอตัวเดียวแต่อึด ควรมีตัวยืนรับกับตัวฟื้นพลังไปด้วย')

  const dangerous = info.foes.filter((f) => f.skill)
  if (dangerous.length) {
    tips.push(`ระวัง ${dangerous.map((f) => f.name).join(' ')} มีสกิลใช้ได้`)
  }

  return tips
}

export { ROLES }
