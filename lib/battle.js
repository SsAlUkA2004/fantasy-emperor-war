import { CHARACTERS, ELEMENTS } from '../data/characters'
import { ENEMIES } from '../data/stages'
import { ALL_BOSS_SPECS } from '../data/worldboss'
import { effectiveStats, entryStats, entrySkillScale, skillScale } from './stats'

// ─────────────────────────────────────────────────────────────
// เครื่องยนต์การต่อสู้ ไม่รู้จัก React เลย รับสถานะเข้ามาแล้วคืนสถานะใหม่ออกไป
// แยกแบบนี้เพื่อให้เฟส 5 เอาไปรันฝั่งเซิร์ฟเวอร์ตอนคำนวณผล PvP ได้โดยไม่ต้องเขียนใหม่
//
// สกิลทุกตัวอ่านมาจากรายการ effects ในไฟล์ characters.js
// ไม่มีโค้ดที่ผูกกับชื่อตัวละครใดเป็นการเฉพาะ เพิ่มตัวละครใหม่จึงไม่ต้องแตะไฟล์นี้
// ─────────────────────────────────────────────────────────────

const ATTACK_GAUGE = 25
const SKILL_GAUGE = 15
const MP_PER_TURN = 2
const MAX_MP = 10
const BURN_PERCENT = 0.05
const BURN_ATK_MULT = 2.5

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
  const mitigated = 100 / (100 + statAfterBuffs(defender, 'def'))
  const element = elementBonus(attacker.element, defender.element)
  // 'crit' ของผู้โจมตีคือ "ความแรงคริ" (โบนัสดาเมจตอนติดคริ) ไม่ใช่โอกาสติดคริอีกต่อไป
  // โอกาสติดคริมาจาก critRate แยกต่างหาก (0-60 ตามเพดานที่ตั้งไว้)
  const crit = Math.random() * 100 < (attacker.critRate ?? 0)
  const critMult = crit ? 1 + (attacker.crit ?? 0) / 100 : 1
  const variance = 0.95 + Math.random() * 0.1

  const raw = attacker.atk * multiplier * mitigated * element * critMult * variance
  return { amount: Math.max(1, Math.round(raw)), crit, element: element > 1 }
}

function log(state, text, kind = 'plain') {
  state.log.push({ text, kind })
  if (state.log.length > 40) state.log.shift()
}

function livingOf(state, side) {
  return state.units.filter((u) => u.side === side && u.alive)
}

function applyDamage(state, unit, amount) {
  if (unit.effects.shield) {
    unit.effects.shield = false
    log(state, `${unit.name} ใช้เกราะรับไว้ได้`)
    return 0
  }
  unit.hp = Math.max(0, unit.hp - amount)
  if (unit.hp === 0) {
    unit.alive = false
    log(state, `${unit.name} ล้มลงแล้ว`, 'fall')
  }
  return amount
}

// ───────── สร้างสนามรบ ─────────

function makeUnit(base, opts) {
  let raw = opts.stats ?? effectiveStats(base.stats, opts.level, opts.star)

  // ตัวคูณของระดับความยาก คูณทั้งเลือด พลังโจมตี และพลังป้องกัน
  // ป้องกันคูณน้อยกว่าเพราะมีผลแบบไม่เป็นเส้นตรง ถ้าคูณเท่ากันศัตรูจะตีไม่เข้าเลย
  if (opts.statScale && opts.statScale !== 1) {
    const f = opts.statScale
    raw = {
      ...raw,
      hp: Math.round(raw.hp * f),
      atk: Math.round(raw.atk * f),
      def: Math.round(raw.def * Math.pow(f, 0.6)),
    }
  }

  // ตัวเดียวสู้กับทีมห้าคนย่อมแพ้ทุกครั้ง ถ้าไม่คูณเลือดให้
  const s = opts.hpScale ? { ...raw, hp: Math.round(raw.hp * opts.hpScale) } : raw
  return {
    key: opts.key,
    side: opts.side,
    charId: base.id,
    name: base.name,
    level: opts.level,
    star: opts.star,
    skillScale: opts.skillScale ?? 1,
    skillLevel: opts.skillLevel ?? 1,
    tier: opts.tier ?? 0,
    awaken: opts.awaken ?? 0,
    element: base.element,
    elementName: ELEMENTS[base.element].name,
    mark: opts.mark,
    maxHp: s.hp,
    // เลือดจริงก่อนคูณ hpScale (ชดเชยที่สู้คนเดียวกับทีมห้าคน) ใช้เป็นฐานคิด % ฟื้นพลัง
    // ไม่งั้นฟื้นพลังจะคำนวณจากเลือดที่พองไปแล้ว กลายเป็นฟื้นทีละก้อนใหญ่จนตีเท่าไหร่ก็ไม่ลด
    baseMaxHp: raw.hp,
    hp: s.hp,
    atk: s.atk,
    def: s.def,
    spd: s.spd,
    crit: s.crit,
    critRate: s.critRate ?? 0,
    mp: 0,
    gauge: 0,
    alive: true,
    skill: base.skill ?? null,
    ultimate: base.ultimate ?? null,
    // ผลพิเศษของท่าโจมตีธรรมดา (ไม่บังคับมี) เช่น "โอกาสสามสิบเปอร์เซ็นต์ทำให้สตัน"
    // รูปแบบเดียวกับ effect ในสกิล/ท่าไม้ตาย แต่ไม่มี target เพราะเป้าหมายคือคนที่โดนตีอยู่แล้วเสมอ
    attackEffects: base.attackEffects ?? null,
    effects: { burn: 0, burnAtk: 0, taunt: 0, defUp: 0, stun: 0, skillLock: 0, shield: false },
  }
}

export function createBattle(allyEntries, stage) {
  const units = [
    ...allyEntries.map((e, i) => {
      const c = CHARACTERS[e.id]
      return makeUnit(c, {
        key: `a${i}`,
        side: 'ally',
        level: e.level ?? 1,
        star: e.star ?? 1,
        skillLevel: e.skillLevel ?? 1,
        tier: e.tier ?? 0,
        awaken: e.awaken ?? 0,
        stats: entryStats(c.id, e),
        skillScale: entrySkillScale(e),
        mark: ELEMENTS[c.element].mark,
      })
    }),
    ...stage.enemies.map((e, i) => {
      // ศัตรูมีสามแบบ มอนสเตอร์ปกติ บอสโลก และตัวละครผู้เล่นที่ถูกใช้เป็นบอส
      // แยกด้วยรหัสนำหน้า เพราะสามอย่างนี้อยู่คนละตารางกัน
      const m = e.id.startsWith('boss:')
        ? ALL_BOSS_SPECS.find((b) => b.id === e.id.slice(5))
        : e.id.startsWith('hero:')
          ? CHARACTERS[e.id.slice(5)]
          : ENEMIES[e.id]
      const isHero = e.id.startsWith('hero:')
      return makeUnit(m, {
        key: `e${i}`,
        side: 'enemy',
        level: e.level ?? 1,
        star: e.star ?? 1,
        skillScale: isHero ? skillScale(e.star ?? 1) : 1,
        stats: isHero ? effectiveStats(m.stats, e.level ?? 1, e.star ?? 1) : undefined,
        hpScale: e.hpScale,
        statScale: e.statScale,
        mark: isHero ? ELEMENTS[m.element].mark : m.mark,
      })
    }),
  ]

  const state = {
    stageId: stage.id,
    round: 1,
    units,
    order: [],
    cursor: 0,
    log: [],
    outcome: null,
    // สรุปท่าล่าสุดแบบมีโครงสร้าง (ไม่ใช่แค่ข้อความ) ให้ฝั่ง UI เอาไปเล่นอนิเมชันได้
    // ว่าใครลงมือ ท่าไหน โดนใครบ้าง คริไหม ฯลฯ โดยไม่ต้องแกะข้อความ log เอาเอง
    lastAction: null,
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
  beginTurn(state)
}

/**
 * เติมพลังเวทให้ตัวที่กำลังจะลงมือ ต้องทำตรงนี้ ไม่ใช่ตอน takeTurn
 * ไม่งั้นหน้าจอจะโชว์ค่าก่อนเติม แล้วผู้เล่นเห็นตัวเลขหักไม่ตรงกับที่เขียนไว้
 */
function beginTurn(state) {
  const actor = currentUnit(state)
  if (actor) actor.mp = Math.min(MAX_MP, actor.mp + MP_PER_TURN)
}

export function currentUnit(state) {
  // หน้าจอเรียกฟังก์ชันนี้ก่อนที่สนามรบจะถูกสร้างเสร็จได้
  // ถ้าไม่กันไว้ การอ่าน state.order จะพังทั้งหน้าและกลายเป็นจอดำ
  if (!state || !Array.isArray(state.order) || state.outcome) return null
  const key = state.order[state.cursor]
  return state.units?.find((u) => u.key === key) ?? null
}

// ───────── ท่าที่เลือกได้ ─────────

export function movesFor(unit) {
  const moves = [{ type: 'attack', name: 'โจมตี', hint: 'ดาเมจ 100%', ready: true }]

  if (unit.skill) {
    const locked = unit.effects.skillLock > 0
    moves.push({
      type: 'skill',
      name: unit.skill.name,
      hint: locked ? 'ถูกล็อกสกิลอยู่' : `ใช้พลังเวท ${unit.skill.mp}`,
      ready: !locked && unit.mp >= unit.skill.mp,
    })
  }
  if (unit.ultimate) {
    moves.push({
      type: 'ultimate',
      name: unit.ultimate.name,
      hint: `เกจ ${unit.gauge}/100`,
      ready: unit.gauge >= 100,
    })
  }

  return moves
}

/** ท่านี้ต้องเลือกเป้าหมายไหม ดูจากว่ามีผลลัพธ์ที่พุ่งไปที่ศัตรูตัวเดียวหรือเปล่า */
export function needsTarget(unit, type) {
  if (type === 'attack') return true
  const move = type === 'skill' ? unit.skill : unit.ultimate
  return Boolean(move?.effects?.some((e) => e.target === 'one'))
}

// ───────── ลงมือ ─────────

function pickFoe(state, actor, chosenKey) {
  const foes = livingOf(state, actor.side === 'ally' ? 'enemy' : 'ally')
  if (!foes.length) return null

  // ถ้าฝั่งตรงข้ามมีใครดึงเป้าอยู่ ต้องตีคนนั้นเท่านั้น
  const taunting = foes.find((u) => u.effects.taunt > 0)
  if (taunting) return taunting

  return foes.find((u) => u.key === chosenKey) ?? foes[0]
}

/** แปลงชื่อเป้าหมายในข้อมูลสกิล ให้เป็นรายชื่อหน่วยจริงในสนาม */
function resolveTargets(state, actor, spec, chosenKey) {
  const allies = livingOf(state, actor.side)

  switch (spec) {
    case 'self':
      return [actor]
    case 'allFoes':
      return livingOf(state, actor.side === 'ally' ? 'enemy' : 'ally')
    case 'allAllies':
      return allies
    case 'lowestAlly': {
      const sorted = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
      return sorted.length ? [sorted[0]] : []
    }
    case 'one':
    default: {
      const foe = pickFoe(state, actor, chosenKey)
      return foe ? [foe] : []
    }
  }
}

const STATUS_LOG_LABEL = {
  burn: 'ติดไฟ',
  stun: 'ขยับไม่ได้',
  taunt: 'ดึงเป้าโจมตี',
  defUp: 'ป้องกันเพิ่มขึ้น',
  shield: 'ได้เกราะ',
  skillLock: 'ถูกล็อกสกิล',
}

/**
 * ใช้ผลลัพธ์หนึ่งก้อน (damage/heal/cleanse/status/mpDown) กับเป้าหมายหนึ่งตัว
 *
 * แยกออกมาจาก runEffects เพื่อให้ basicAttack เรียกใช้ตรรกะชุดเดียวกันได้
 * (ผ่าน unit.attackEffects) โดยไม่ต้องมี resolveTargets เพราะท่าโจมตีธรรมดารู้เป้าหมายอยู่แล้ว
 */
function applyEffectToTarget(state, actor, effect, target, scale = 1) {
  if (effect.kind === 'damage') {
    const bonus = effect.bonusOn && target.effects[effect.bonusOn] ? effect.bonusMult : 1
    const { amount, crit, element } = computeDamage(actor, target, effect.mult * scale * bonus)
    const dealt = applyDamage(state, target, amount)
    state.lastAction?.hits.push({
      targetKey: target.key,
      kind: dealt === 0 ? 'block' : 'damage',
      amount: dealt,
      crit,
      elementAdv: element,
    })

    const tags = [crit && 'คริติคอล', element && 'แพ้ทางธาตุ', bonus > 1 && 'ขยายผล'].filter(Boolean)
    log(
      state,
      `${target.name} เสีย ${amount} หน่วย${tags.length ? ` (${tags.join(' ')})` : ''}`,
      actor.side
    )
    return
  }

  if (effect.kind === 'heal') {
    // ใช้ baseMaxHp (เลือดก่อนคูณ hpScale) ไม่ใช่ maxHp ตรง ๆ
    // กันบอสที่มีสกิลฟื้นพลังฟื้นเป็นก้อนมหาศาลจากเลือดที่ถูกพองไว้สู้ทีมห้าคน
    const heal = Math.round((target.baseMaxHp ?? target.maxHp) * effect.percent * scale)
    target.hp = Math.min(target.maxHp, target.hp + heal)
    state.lastAction?.hits.push({ targetKey: target.key, kind: 'heal', amount: heal })
    log(state, `${target.name} ฟื้นพลัง ${heal} หน่วย`, actor.side)
    return
  }

  if (effect.kind === 'cleanse') {
    target.effects.burn = 0
    target.effects.burnAtk = 0
    target.effects.stun = 0
    target.effects.skillLock = 0
    state.lastAction?.hits.push({ targetKey: target.key, kind: 'cleanse' })
    log(state, `${target.name} หลุดจากสถานะติดลบ`, actor.side)
    return
  }

  if (effect.kind === 'mpDown') {
    if (effect.chance && Math.random() > effect.chance) return
    const before = target.mp
    target.mp = Math.max(0, target.mp - effect.amount)
    const lost = before - target.mp
    state.lastAction?.hits.push({ targetKey: target.key, kind: 'mpDown', amount: lost })
    log(state, `${target.name} เสียพลังเวท ${lost} หน่วย`, actor.side)
    return
  }

  if (effect.kind === 'status') {
    if (effect.chance && Math.random() > effect.chance) return
    if (effect.status === 'shield') target.effects.shield = true
    else target.effects[effect.status] = effect.turns

    // จำพลังโจมตีของคนที่จุดไฟไว้ด้วย
    // เดิมไฟเผาคิดจากเปอร์เซ็นต์ของเลือดสูงสุดอย่างเดียว
    // พอเจอศัตรูเลือดหลายสิบล้านอย่างบอสโลก ไฟจะกินทีละหลายล้านต่อเทิร์น
    // แล้วละลายบอสทั้งตัวโดยที่ผู้เล่นแทบไม่ต้องทำอะไร
    if (effect.status === 'burn') target.effects.burnAtk = actor.atk

    state.lastAction?.hits.push({ targetKey: target.key, kind: 'status', status: effect.status })
    log(state, `${target.name} ${STATUS_LOG_LABEL[effect.status] ?? effect.status}`, actor.side)
  }
}

function runEffects(state, actor, move, chosenKey) {
  const scale = actor.skillScale

  move.effects.forEach((effect) => {
    const targets = resolveTargets(state, actor, effect.target, chosenKey)
    targets.forEach((target) => applyEffectToTarget(state, actor, effect, target, scale))
  })
}

function basicAttack(state, actor, targetKey) {
  const target = pickFoe(state, actor, targetKey)
  if (!target) return

  const { amount, crit, element } = computeDamage(actor, target, 1)
  const dealt = applyDamage(state, target, amount)
  actor.gauge = Math.min(100, actor.gauge + ATTACK_GAUGE)
  state.lastAction?.hits.push({
    targetKey: target.key,
    kind: dealt === 0 ? 'block' : 'damage',
    amount: dealt,
    crit,
    elementAdv: element,
  })

  const tags = [crit && 'คริติคอล', element && 'แพ้ทางธาตุ'].filter(Boolean)
  log(
    state,
    `${actor.name} โจมตี ${target.name} เสีย ${amount} หน่วย${tags.length ? ` (${tags.join(' ')})` : ''}`,
    actor.side
  )

  if (target.alive && actor.attackEffects) {
    actor.attackEffects.forEach((effect) => applyEffectToTarget(state, actor, effect, target))
  }
}

function endOfTurn(state, actor) {
  if (actor.effects.burn > 0 && actor.alive) {
    // เอาค่าที่น้อยกว่าระหว่างเปอร์เซ็นต์เลือด กับพลังโจมตีของคนจุดไฟ
    // ทำให้ไฟแรงตามคนจุด ไม่ใช่แรงตามขนาดของเป้าหมาย
    const byPercent = actor.maxHp * BURN_PERCENT
    const byPower = (actor.effects.burnAtk ?? 0) * BURN_ATK_MULT
    const raw = byPower > 0 ? Math.min(byPercent, byPower) : byPercent
    // ต้องลดทอนด้วยพลังป้องกันเหมือนดาเมจปกติ ไม่งั้นไฟจะแรงกว่าดาเมจตรงหลายเท่าตัว
    // กับเป้าหมายป้องกันสูง (บอสปลายเกม) เพราะดาเมจตรงโดนสูตรลดทอนนี้กัดกินไปแล้ว แต่ไฟไม่โดน
    // ผลคือทีมที่มีตัวติดไฟชนะง่ายกว่าทีมค่าพลังสูงกว่าที่ไม่มีตัวติดไฟมาก จนค่าพลังใช้ทำนายผลไม่ได้เลย
    const mitigated = raw * (100 / (100 + statAfterBuffs(actor, 'def')))
    const burn = Math.max(1, Math.round(mitigated))
    applyDamage(state, actor, burn)
    actor.effects.burn -= 1
    if (actor.effects.burn === 0) actor.effects.burnAtk = 0
    log(state, `${actor.name} ถูกไฟเผา เสีย ${burn} หน่วย`, 'burn')
  }
  if (actor.effects.taunt > 0) actor.effects.taunt -= 1
  if (actor.effects.defUp > 0) actor.effects.defUp -= 1
  if (actor.effects.skillLock > 0) actor.effects.skillLock -= 1
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
    if (u && u.alive) {
      beginTurn(state)
      return
    }
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

  if (actor.effects.stun > 0) {
    next.lastAction = { actorKey: actor.key, side: actor.side, type: 'stunned', hits: [] }
    actor.effects.stun -= 1
    log(next, `${actor.name} ยังขยับไม่ได้`)
    endOfTurn(next, actor)
    if (!checkOutcome(next)) advance(next)
    return next
  }

  const move = action ?? decideAction(next, actor)
  const willUltimate = move.type === 'ultimate' && actor.ultimate
  const willSkill = move.type === 'skill' && actor.skill

  // ตั้งก่อนเรียก runEffects/basicAttack เสมอ เพราะทั้งสองฟังก์ชันนั้นเก็บผลแต่ละก้อน
  // (โดนใคร ดาเมจเท่าไหร่ คริไหม) ลงใน lastAction.hits ระหว่างทำงาน
  next.lastAction = {
    actorKey: actor.key,
    side: actor.side,
    type: willUltimate ? 'ultimate' : willSkill ? 'skill' : 'attack',
    hits: [],
  }

  if (willUltimate) {
    actor.gauge = 0
    log(next, `${actor.name} ปลดปล่อย ${actor.ultimate.name}`, actor.side)
    runEffects(next, actor, actor.ultimate, move.target)
  } else if (willSkill) {
    actor.mp -= actor.skill.mp
    actor.gauge = Math.min(100, actor.gauge + SKILL_GAUGE)
    log(next, `${actor.name} ร่าย ${actor.skill.name}`, actor.side)
    runEffects(next, actor, actor.skill, move.target)
  } else {
    basicAttack(next, actor, move.target)
  }

  endOfTurn(next, actor)
  if (!checkOutcome(next)) advance(next)
  return next
}

/**
 * สมองของออโต้ ใช้ร่วมกันทั้งฝั่งมอนสเตอร์และฝั่งผู้เล่น
 * ตัดสินใจจากชนิดของผลลัพธ์ในสกิล ไม่ได้ดูว่าเป็นตัวละครไหน
 */
export function decideAction(state, actor) {
  const foes = livingOf(state, actor.side === 'ally' ? 'enemy' : 'ally')
  const target = [...foes].sort((a, b) => a.hp - b.hp)[0]?.key

  if (actor.ultimate && actor.gauge >= 100) return { type: 'ultimate', target }

  if (actor.skill && actor.effects.skillLock === 0 && actor.mp >= actor.skill.mp) {
    const effects = actor.skill.effects
    const heals = effects.some((e) => e.kind === 'heal')
    const buffsSelf = effects.every((e) => e.target === 'self')
    const dealsDamage = effects.some((e) => e.kind === 'damage')

    // สกิลฟื้นพลัง ใช้ต่อเมื่อมีคนเลือดต่ำกว่า 60% เท่านั้น
    if (heals) {
      if (livingOf(state, actor.side).some((a) => a.hp / a.maxHp < 0.6)) return { type: 'skill' }
    } else if (buffsSelf) {
      // สกิลบัฟตัวเอง ใช้ต่อเมื่อบัฟยังไม่ติดอยู่ จะได้ไม่กดซ้ำทิ้ง
      if (actor.effects.taunt === 0 && actor.effects.defUp === 0) return { type: 'skill' }
    } else if (dealsDamage) {
      return { type: 'skill', target }
    } else {
      return { type: 'skill', target }
    }
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
