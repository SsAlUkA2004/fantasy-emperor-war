import { CHARACTERS, ELEMENTS } from '../data/characters'
import { ENEMIES } from '../data/stages'

// ─────────────────────────────────────────────────────────────
// เครื่องยนต์การต่อสู้ ไม่รู้จัก React เลย รับสถานะเข้ามาแล้วคืนสถานะใหม่ออกไป
// แยกแบบนี้เพื่อให้เฟส 5 เอาไปรันฝั่งเซิร์ฟเวอร์ตอนคำนวณผล PvP ได้โดยไม่ต้องเขียนใหม่
// ─────────────────────────────────────────────────────────────

const ATTACK_GAUGE = 25
const SKILL_GAUGE = 15
const MP_PER_TURN = 2
const BURN_PERCENT = 0.05

function clone(state) {
  return JSON.parse(JSON.stringify(state))
}

function elementBonus(attacker, defender) {
  return ELEMENTS[attacker]?.beats === defender ? 1.3 : 1
}

function statAfterBuffs(unit, key) {
  if (key === 'def' && unit.effects.defUp > 0) return Math.round(unit.def * 1.5)
  return unit[key]
}

function computeDamage(attacker, defender, multiplier) {
  const def = statAfterBuffs(defender, 'def')
  const mitigated = 100 / (100 + def)
  const element = elementBonus(attacker.element, defender.element)
  const crit = Math.random() * 100 < attacker.crit
  const variance = 0.95 + Math.random() * 0.1

  const raw = attacker.atk * multiplier * mitigated * element * (crit ? 1.5 : 1) * variance
  return { amount: Math.max(1, Math.round(raw)), crit, element: element > 1 }
}

function applyDamage(state, unit, amount) {
  if (unit.effects.shield) {
    unit.effects.shield = false
    log(state, `${unit.name} ใช้เกราะแสงรับไว้ได้`)
    return 0
  }
  unit.hp = Math.max(0, unit.hp - amount)
  if (unit.hp === 0) {
    unit.alive = false
    log(state, `${unit.name} ล้มลงแล้ว`, 'fall')
  }
  return amount
}

function log(state, text, kind = 'plain') {
  state.log.push({ text, kind })
  if (state.log.length > 40) state.log.shift()
}

function livingOf(state, side) {
  return state.units.filter((u) => u.side === side && u.alive)
}

// ───────── สร้างสนามรบ ─────────

function buildAlly(entry, index) {
  const c = CHARACTERS[entry.id]
  const growth = 1 + (entry.level - 1) * 0.08
  const star = 1 + (entry.star - 1) * 0.15

  return {
    key: `a${index}`,
    side: 'ally',
    charId: c.id,
    name: c.name,
    element: c.element,
    mark: ELEMENTS[c.element].mark,
    maxHp: Math.round(c.stats.hp * growth * star),
    hp: Math.round(c.stats.hp * growth * star),
    atk: Math.round(c.stats.atk * growth * star),
    def: Math.round(c.stats.def * growth * star),
    spd: c.stats.spd,
    crit: c.stats.crit,
    mp: 0,
    gauge: 0,
    alive: true,
    effects: { burn: 0, taunt: 0, defUp: 0, stun: 0, shield: false },
  }
}

function buildEnemy(entry, index) {
  const e = ENEMIES[entry.id]
  const growth = 1 + (entry.level - 1) * 0.08

  return {
    key: `e${index}`,
    side: 'enemy',
    charId: e.id,
    name: e.name,
    element: e.element,
    mark: e.mark,
    maxHp: Math.round(e.stats.hp * growth),
    hp: Math.round(e.stats.hp * growth),
    atk: Math.round(e.stats.atk * growth),
    def: Math.round(e.stats.def * growth),
    spd: e.stats.spd,
    crit: e.stats.crit,
    mp: 0,
    gauge: 0,
    alive: true,
    hasSkill: Boolean(e.skill),
    effects: { burn: 0, taunt: 0, defUp: 0, stun: 0, shield: false },
  }
}

export function createBattle(allyEntries, stage) {
  const units = [
    ...allyEntries.map(buildAlly),
    ...stage.enemies.map(buildEnemy),
  ]

  const state = {
    stageId: stage.id,
    round: 1,
    units,
    order: [],
    cursor: 0,
    log: [],
    outcome: null,
  }

  log(state, stage.intro, 'intro')
  startRound(state)
  return state
}

function startRound(state) {
  state.order = state.units
    .filter((u) => u.alive)
    .sort((a, b) => b.spd - a.spd)
    .map((u) => u.key)
  state.cursor = 0
}

export function currentUnit(state) {
  if (state.outcome) return null
  const key = state.order[state.cursor]
  return state.units.find((u) => u.key === key) ?? null
}

// ───────── ท่าที่เลือกได้ ─────────

export function movesFor(unit) {
  const c = CHARACTERS[unit.charId]
  const moves = [{ type: 'attack', name: 'โจมตี', hint: 'ดาเมจ 100%', ready: true }]

  if (c) {
    moves.push({
      type: 'skill',
      name: c.skill.name,
      hint: `ใช้พลังเวท ${c.skill.mp}`,
      ready: unit.mp >= c.skill.mp,
    })
    moves.push({
      type: 'ultimate',
      name: c.ultimate.name,
      hint: `เกจ ${unit.gauge}/100`,
      ready: unit.gauge >= 100,
    })
  }

  return moves
}

export function needsTarget(unit, type) {
  const c = CHARACTERS[unit.charId]
  if (type === 'attack') return true
  if (!c) return true
  if (unit.charId === 'athen') return true
  if (unit.charId === 'galen') return type === 'ultimate' ? false : false
  if (unit.charId === 'lumina') return false
  return true
}

// ───────── ลงมือ ─────────

function pickEnemyTarget(state, actor, chosenKey) {
  const foes = livingOf(state, actor.side === 'ally' ? 'enemy' : 'ally')
  if (!foes.length) return null

  // ถ้าฝั่งตรงข้ามมีใครดึงเป้าอยู่ ต้องตีคนนั้นเท่านั้น
  const taunting = foes.find((u) => u.effects.taunt > 0)
  if (taunting) return taunting

  const chosen = foes.find((u) => u.key === chosenKey)
  return chosen ?? foes[0]
}

function basicAttack(state, actor, targetKey) {
  const target = pickEnemyTarget(state, actor, targetKey)
  if (!target) return

  const { amount, crit, element } = computeDamage(actor, target, 1)
  applyDamage(state, target, amount)
  actor.gauge = Math.min(100, actor.gauge + ATTACK_GAUGE)

  const tags = [crit && 'คริติคอล', element && 'แพ้ทางธาตุ'].filter(Boolean)
  log(
    state,
    `${actor.name} โจมตี ${target.name} เสีย ${amount} หน่วย${tags.length ? ` (${tags.join(' ')})` : ''}`,
    actor.side
  )
}

function useSkill(state, actor, targetKey) {
  const c = CHARACTERS[actor.charId]

  // ฝั่งมอนสเตอร์ใช้สกิลตามข้อมูลในไฟล์ stages
  if (!c) {
    const e = ENEMIES[actor.charId]
    const target = pickEnemyTarget(state, actor, targetKey)
    if (!target || !e.skill) return
    actor.mp -= e.skill.mp
    const { amount } = computeDamage(actor, target, e.skill.multiplier)
    applyDamage(state, target, amount)
    if (e.skill.burn) target.effects.burn = e.skill.burn
    actor.gauge = Math.min(100, actor.gauge + SKILL_GAUGE)
    log(state, `${actor.name} ร่าย ${e.skill.name} ใส่ ${target.name} เสีย ${amount} หน่วย`, 'enemy')
    return
  }

  actor.mp -= c.skill.mp
  actor.gauge = Math.min(100, actor.gauge + SKILL_GAUGE)

  if (actor.charId === 'athen') {
    const target = pickEnemyTarget(state, actor, targetKey)
    if (!target) return
    const { amount } = computeDamage(actor, target, 1.8)
    applyDamage(state, target, amount)
    target.effects.burn = 2
    log(state, `${actor.name} ร่ายฟันเพลิงคำราม เสีย ${amount} หน่วย และ ${target.name} ติดไฟ`, 'ally')
    return
  }

  if (actor.charId === 'galen') {
    actor.effects.taunt = 2
    actor.effects.defUp = 2
    log(state, `${actor.name} ตั้งกำแพงปฐพี ดึงเป้าโจมตีมาที่ตัวเอง`, 'ally')
    return
  }

  if (actor.charId === 'lumina') {
    const allies = livingOf(state, 'ally')
    const hurt = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    if (!hurt) return
    const heal = Math.round(hurt.maxHp * 0.3)
    hurt.hp = Math.min(hurt.maxHp, hurt.hp + heal)
    hurt.effects.burn = 0
    hurt.effects.stun = 0
    log(state, `${actor.name} ร่ายพรจันทรา ฟื้นพลัง ${hurt.name} ${heal} หน่วย`, 'ally')
  }
}

function useUltimate(state, actor, targetKey) {
  const c = CHARACTERS[actor.charId]
  if (!c) return
  actor.gauge = 0

  if (actor.charId === 'athen') {
    const target = pickEnemyTarget(state, actor, targetKey)
    if (!target) return
    const burning = target.effects.burn > 0
    const { amount } = computeDamage(actor, target, burning ? 6 : 4)
    applyDamage(state, target, amount)
    log(
      state,
      `${actor.name} ปลดปล่อยอัคนีมหาประลัย เสีย ${amount} หน่วย${burning ? ' ขยายผลจากไฟที่ติดอยู่' : ''}`,
      'ally'
    )
    return
  }

  if (actor.charId === 'galen') {
    const foes = livingOf(state, 'enemy')
    log(state, `${actor.name} กระแทกพื้นด้วยปฐพีสั่นสะเทือน`, 'ally')
    foes.forEach((f) => {
      const { amount } = computeDamage(actor, f, 1.5)
      applyDamage(state, f, amount)
      if (f.alive && Math.random() < 0.5) {
        f.effects.stun = 1
        log(state, `${f.name} เสียหลักจนขยับไม่ได้`, 'ally')
      }
    })
    return
  }

  if (actor.charId === 'lumina') {
    const allies = livingOf(state, 'ally')
    log(state, `${actor.name} กางม่านแสงศักดิ์สิทธิ์คลุมทั้งทีม`, 'ally')
    allies.forEach((a) => {
      const heal = Math.round(a.maxHp * 0.25)
      a.hp = Math.min(a.maxHp, a.hp + heal)
      a.effects.shield = true
    })
  }
}

function endOfTurn(state, actor) {
  if (actor.effects.burn > 0 && actor.alive) {
    const burn = Math.round(actor.maxHp * BURN_PERCENT)
    applyDamage(state, actor, burn)
    actor.effects.burn -= 1
    log(state, `${actor.name} ถูกไฟเผา เสีย ${burn} หน่วย`, 'burn')
  }
  if (actor.effects.taunt > 0) actor.effects.taunt -= 1
  if (actor.effects.defUp > 0) actor.effects.defUp -= 1
}

function checkOutcome(state) {
  if (!livingOf(state, 'enemy').length) {
    state.outcome = 'won'
    log(state, 'ศัตรูหมดแล้ว', 'win')
    return true
  }
  if (!livingOf(state, 'ally').length) {
    state.outcome = 'lost'
    log(state, 'ทีมของคุณล้มทั้งหมด', 'lose')
    return true
  }
  return false
}

function advance(state) {
  state.cursor += 1
  while (state.cursor < state.order.length) {
    const u = state.units.find((x) => x.key === state.order[state.cursor])
    if (u && u.alive) return
    state.cursor += 1
  }
  state.round += 1
  startRound(state)
}

/**
 * เดินหนึ่งเทิร์น ถ้า action เป็น null แปลว่าให้ AI ตัดสินใจแทน
 * ใช้ทั้งกับมอนสเตอร์และกับโหมดออโต้ของผู้เล่น
 */
export function takeTurn(state, action = null) {
  const next = clone(state)
  const actor = currentUnit(next)
  if (!actor) return next

  actor.mp = Math.min(10, actor.mp + MP_PER_TURN)

  if (actor.effects.stun > 0) {
    actor.effects.stun -= 1
    log(next, `${actor.name} ยังขยับไม่ได้`, 'plain')
    endOfTurn(next, actor)
    if (!checkOutcome(next)) advance(next)
    return next
  }

  const move = action ?? decideAction(next, actor)

  if (move.type === 'ultimate') useUltimate(next, actor, move.target)
  else if (move.type === 'skill') useSkill(next, actor, move.target)
  else basicAttack(next, actor, move.target)

  endOfTurn(next, actor)
  if (!checkOutcome(next)) advance(next)
  return next
}

/**
 * สมองของออโต้ ใช้ร่วมกันทั้งฝั่งมอนสเตอร์และฝั่งผู้เล่น
 * เรียงความสำคัญ: ท่าไม้ตายเมื่อพร้อม → สกิลเมื่อคุ้ม → โจมตีปกติ
 */
export function decideAction(state, actor) {
  const c = CHARACTERS[actor.charId]
  const foes = livingOf(state, actor.side === 'ally' ? 'enemy' : 'ally')
  const weakest = [...foes].sort((a, b) => a.hp - b.hp)[0]
  const target = weakest?.key

  if (c) {
    if (actor.gauge >= 100) return { type: 'ultimate', target }

    if (actor.mp >= c.skill.mp) {
      if (actor.charId === 'lumina') {
        const hurt = livingOf(state, 'ally').some((a) => a.hp / a.maxHp < 0.6)
        if (hurt) return { type: 'skill' }
      } else if (actor.charId === 'galen') {
        if (actor.effects.taunt === 0) return { type: 'skill' }
      } else {
        const t = foes.find((f) => f.key === target)
        if (t && t.effects.burn === 0) return { type: 'skill', target }
      }
    }
  } else if (actor.hasSkill && actor.mp >= 3) {
    return { type: 'skill', target }
  }

  return { type: 'attack', target }
}

export function starsEarned(state) {
  if (state.outcome !== 'won') return 0
  const down = state.units.filter((u) => u.side === 'ally' && !u.alive).length
  if (down === 0) return 3
  if (down === 1) return 2
  return 1
}
