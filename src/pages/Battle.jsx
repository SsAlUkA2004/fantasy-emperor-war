import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { STAGES } from '../data/stages'
import { findStage } from '../data/materials'
import { FLOORS as DUNGEON_FLOORS } from '../data/dungeon'
import { createBattle, currentUnit, needsTarget, takeTurn, starsEarned } from '../lib/battle'
import { loadCollection as reloadCollection } from '../lib/player'
import { awardExp, loadCollection } from '../lib/player'
import { saveStageResult } from '../lib/progress'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { runCharDungeon } from '../lib/chardungeon'
import { spendHelper } from '../lib/helper'
import { ROUND_LIMIT, decideByHp } from '../lib/pvp'
import { DIFFICULTIES, STORY_ROUND_LIMIT } from '../data/stages'
import { stagePower, teamPower } from '../lib/power'
import { CHARACTERS } from '../data/characters'
import { MATERIALS, MATERIAL_IDS } from '../data/materials'
import { GRADES, SLOTS } from '../data/gear'
import BattleStage from '../components/BattleStage'

const STEP_DELAY = 750

export default function Battle() {
  const { stageId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const helper = location.state?.helper ?? null
  const { user, player, refresh } = usePlayer()

  const [state, setState] = useState(null)
  const [auto, setAuto] = useState(false)
  const [target, setTarget] = useState(null)
  const [reward, setReward] = useState(null)
  const [round, setRound] = useState(0)
  const roster = useRef([])
  const saved = useRef(false)

  const stage = findStage(stageId)

  // ด่านถัดไปในลำดับรวมทั้งเกม ข้ามบทได้เอง
  // ลานฝึกกับเหมืองไม่มีด่านถัดไป เพราะไม่ได้อยู่ในลำดับเนื้อเรื่อง
  const nextStage = (() => {
    if (!stage) return null
    // ดันเจี้ยนไปชั้นถัดไป ถ้ายังไม่ถึงชั้นบนสุด
    if (stage.dungeon) {
      return stage.floor < DUNGEON_FLOORS
        ? { id: `d-${stage.floor + 1}`, name: `ชั้นที่ ${stage.floor + 1}` }
        : null
    }
    if (stage.training || stage.gemStage || stage.materialStage) return null

    const base = stage.id.split('@')[0]
    const sfx = stage.id.includes('@') ? '@' + stage.id.split('@')[1] : ''
    const i = STAGES.findIndex((x) => x.id === base)
    if (i < 0) return null

    // ยังมีด่านต่อไปในโหมดเดียวกัน
    if (i < STAGES.length - 1) {
      const next = STAGES[i + 1]
      return { id: next.id + sfx, name: next.name }
    }

    // จบโหมดนี้แล้ว ชวนไปเริ่มโหมดถัดไปตั้งแต่ด่านแรก
    // ถ้าไม่มีปุ่มนี้ ผู้เล่นต้องกลับไปแผนที่แล้วหาแท็บโหมดเอาเอง
    const at = DIFFICULTIES.findIndex((d) => d.suffix === sfx)
    const nextDiff = DIFFICULTIES[at + 1]
    if (!nextDiff) return null
    return {
      id: STAGES[0].id + nextDiff.suffix,
      name: `บทที่ 1 โหมด${nextDiff.name}`,
      newDifficulty: nextDiff.name,
    }
  })()

  // กลับไปหน้าที่มาจริง ไม่ใช่แผนที่ด่านเสมอ
  const backTo = stage?.dungeon ? '/dungeon' : stage?.charDungeon ? '/hunt' : '/stages'

  // round เปลี่ยนค่าเมื่อกดเล่นอีกครั้ง ทำให้ตั้งสนามรบใหม่ทั้งหมด
  useEffect(() => {
    if (!stage) return
    saved.current = false
    setReward(null)
    setTarget(null)
    setState(null)
    loadCollection(user.uid).then((owned) => {
      const team = (player.team ?? [])
        .map((id) => owned.find((o) => o.id === id))
        .filter(Boolean)

      // ตัวที่ยืมมาต่อท้ายทีม ไม่กินช่องของเราเอง
      // และไม่นับเป็นตัวของเราตอนแจกค่าประสบการณ์ เพราะไม่ใช่ตัวละครของเรา
      roster.current = team
      const full = helper ? [...team, { ...helper.entry, id: helper.entry.id }] : team

      if (full.length) setState(createBattle(full, stage))
    })
  }, [stageId, round])

  // เดินเทิร์นอัตโนมัติ เมื่อถึงคิวมอนสเตอร์ หรือเมื่อเปิดออโต้ไว้
  useEffect(() => {
    if (!state || state.outcome) return

    // ด่านรอยอดีต ครบรอบแล้วยังไม่จบ ปกติตัดสินด้วยเลือดที่เหลือ เพราะบอสเป็นตัวละคร
    // ที่อาจมีสกิลฟื้นพลังทำให้ต่อสู้ยืดเยื้อ แต่ถ้าค่าพลังทีมเรามากกว่าศัตรูอยู่แล้ว
    // ให้ตัดสินว่าชนะไปเลย ไม่ต้องรอลุ้นเลือดที่เหลือ เพราะทีมที่แรงกว่าจริงไม่ควรแพ้
    // แค่เพราะสู้ยืดเยื้อเกินไปจนหมดเวลา
    if (stage?.charDungeon && state.round > ROUND_LIMIT) {
      setState((s) => {
        const myPower = teamPower(roster.current)
        const foePower = stagePower(stage)
        if (myPower > foePower) {
          return {
            ...s,
            outcome: 'won',
            log: [
              ...s.log,
              { text: `ครบ ${ROUND_LIMIT} รอบ แต่ทีมแรงกว่าศัตรู ตัดสินให้ชนะ`, kind: 'win' },
            ],
          }
        }
        return decideByHp(s)
      })
      return
    }

    // ด่านอื่นทั้งหมดต้องมีเพดานเหมือนกัน
    //
    // ก่อนหน้านี้ไม่มีเลย ถ้าทีมตีไม่พอที่จะฆ่าบอสและบอสก็ฆ่าทีมไม่ได้
    // การต่อสู้จะวนไปเรื่อย ๆ ไม่มีวันจบ ซึ่งเป็นอาการที่เจอในบทที่ 7
    // ตัดสินเป็นแพ้เพราะไม่สามารถล้มศัตรูได้ในเวลาที่กำหนด
    if (state.round > STORY_ROUND_LIMIT) {
      setState((s) => ({
        ...s,
        outcome: 'lost',
        timedOut: true,
        log: [
          ...s.log,
          { text: `ครบ ${STORY_ROUND_LIMIT} รอบแล้วยังล้มศัตรูไม่ได้`, kind: 'lose' },
        ],
      }))
      return
    }

    const actor = currentUnit(state)
    if (!actor) return
    if (actor.side === 'ally' && !auto) return

    const t = setTimeout(() => setState((s) => takeTurn(s, null)), STEP_DELAY)
    return () => clearTimeout(t)
  }, [state, auto])

  // บันทึกผลครั้งเดียวเมื่อจบ
  useEffect(() => {
    if (!state?.outcome || saved.current) return
    saved.current = true

    if (state.outcome === 'won' && stage.charDungeon) {
      loadCollection(user.uid)
        .then(async (owned) => {
          const r = await runCharDungeon({ ...player, uid: user.uid }, stage, owned)
          // ตัวละครที่ร่วมรบได้ค่าประสบการณ์เหมือนด่านอื่น
          const levels = await awardExp(user.uid, roster.current, stage.exp ?? 0).catch(() => null)
          return { ...r, levels }
        })
        .then(async (r) => {
          setReward({ stars: 0, firstClear: false, gems: 0, hunt: r, exp: stage.exp, levels: r.levels, coins: r.coins })
          await refresh()
        })
        .catch((e) =>
          setReward({ stars: 0, firstClear: false, gems: 0, failed: true, why: explainError('บันทึกผลไม่สำเร็จ', e) })
        )
      return
    }

    if (state.outcome === 'won') {
      const stars = starsEarned(state)
      const exp = stage.exp ?? 0

      Promise.all([
        saveStageResult({ ...player, uid: user.uid }, stage, stars, exp),
        awardExp(user.uid, roster.current, exp),
      ])
        .then(([r, levels]) => {
          setReward({ stars, exp, levels, ...r })
          return refresh()
        })
        .catch((e) =>
          setReward({ stars, firstClear: false, gems: 0, failed: true, why: explainError('บันทึกผลไม่สำเร็จ', e) })
        )
    }
  }, [state?.outcome])

  if (!stage) return <Missing message="ไม่พบด่านนี้" onBack={() => navigate('/stages')} />
  if (!state) return <Missing message="กำลังจัดทัพ" />

  const actor = currentUnit(state)
  const yourTurn = actor?.side === 'ally' && !auto && !state.outcome
  const foes = state.units.filter((u) => u.side === 'enemy')
  const allies = state.units.filter((u) => u.side === 'ally')

  function act(type) {
    const move = { type }
    if (needsTarget(actor, type)) {
      const alive = foes.filter((f) => f.alive)
      move.target = alive.find((f) => f.key === target)?.key ?? alive[0]?.key
    }
    setState((s) => takeTurn(s, move))
  }

  return (
    <main className="screen top battle">
      <div className="sheet">
        <header className="battle-head">
          <button className="plain-link inline" onClick={() => navigate(backTo)}>
            ← ออก
          </button>
          <div className="battle-title">
            <h1>{stage.name}</h1>
            <p className="meta">รอบที่ {state.round}</p>
          </div>
          <button className="plain-link inline" onClick={() => setAuto((a) => !a)}>
            ออโต้ {auto ? 'เปิด' : 'ปิด'}
          </button>
        </header>

        <BattleStage
          state={state}
          actor={actor}
          auto={auto}
          target={target}
          setTarget={setTarget}
          onAct={act}
        />
      </div>

      {state.outcome && (
        <Result
          outcome={state.outcome}
          reward={reward}
          training={stage.training}
          gemStage={stage.gemStage}
          nextStage={nextStage}
          onNext={() => navigate(`/battle/${nextStage.id}`)}
          onAgain={() => setRound((r) => r + 1)}
          onBack={() => navigate(backTo)}
          backLabel={stage.dungeon ? 'กลับไปหอคอย' : 'กลับไปแผนที่'}
        />
      )}
    </main>
  )
}

function Result({ outcome, reward, training, gemStage, nextStage, onNext, onAgain, onBack, backLabel, timedOut, bossLeft }) {
  const won = outcome === 'won'

  // ด่านที่มีโควตารายวัน (เหมือง/ดันเจี้ยน/ด่านหาของ/รอยอดีต) กดเล่นอีกครั้งต่อไม่ได้แล้ว
  // ถ้ารอบนี้ไม่ได้รางวัลเพราะครบโควตา หรือรอบนี้คือรอบสุดท้ายที่เหลือพอดี
  // กันไม่ให้ผู้เล่นสู้ต่อไปเรื่อย ๆ แบบไม่ได้อะไรเลย
  const noRunsLeft =
    Boolean(reward?.quotaSpent) ||
    reward?.runsLeft === 0 ||
    (reward?.hunt && reward.hunt.left <= 0)

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel result popup" data-outcome={outcome}>
        <div className="panel-head">{won ? 'ชนะแล้ว' : 'พ่ายแพ้'}</div>
      {won ? (
        <>
          {!training && !gemStage && <p className="stars">{'★'.repeat(reward?.stars ?? 0).padEnd(3, '☆')}</p>}
          {reward?.exp > 0 && (
            <p>ตัวละครได้ค่าประสบการณ์ {reward.exp.toLocaleString('th-TH')} หน่วย</p>
          )}
          {reward?.accountExp > 0 && (
            <p className="acct-exp">
              เลเวลผู้เล่นได้ {reward.accountExp.toLocaleString('th-TH')} หน่วย
            </p>
          )}
          {reward?.levels
            ?.filter((l) => l.gained > 0)
            .map((l) => (
              <p className="levelup" key={l.id}>
                เลเวลขึ้นเป็น {l.level} แล้ว
              </p>
            ))}
          {reward?.levels?.some((l) => l.level >= l.cap) && (
            <p className="meta">บางตัวชนเพดานเลเวลแล้ว ต้องเพิ่มดาวเพื่อดันเพดานขึ้นไปอีก</p>
          )}
          {reward?.account?.gained > 0 && (
            <p className="levelup">เลเวลผู้เล่นขึ้นเป็น {reward.account.level}</p>
          )}
          {reward?.hunt && (
            <>
              {reward.hunt.got ? (
                <p className="levelup">
                  {reward.hunt.got.isNew
                    ? `${reward.hunt.name} เข้าร่วมทีมแล้ว`
                    : `มี${reward.hunt.name}อยู่แล้ว ได้เศษวิญญาณ ${reward.hunt.got.shards}`}
                </p>
              ) : (
                <p className="meta">รอบนี้ไม่ได้อะไร ลองอีกครั้ง</p>
              )}
              <p className="meta tiny">ด่านนี้เหลืออีก {reward.hunt.left} ครั้งในชั่วโมงนี้</p>
            </>
          )}
          {reward?.newFloor && <p className="levelup">พิชิตชั้นใหม่ได้แล้ว</p>}
          {reward?.coins > 0 && <p>ได้เหรียญ {reward.coins.toLocaleString('th-TH')}</p>}
          {reward?.drop && (
            <p className="levelup" style={{ color: GRADES[reward.drop.grade].color }}>
              ได้{SLOTS[reward.drop.slot].name}
              {GRADES[reward.drop.grade].name} ระดับไอเทม {reward.drop.ilvl}
            </p>
          )}
          {reward?.firstClear && <p>ผ่านครั้งแรก ได้เพชร {reward.gems} เม็ด</p>}
          {reward?.runsLeft !== undefined && (
            <p className="levelup">
              ได้เพชร {reward.gems} เม็ด · วันนี้เหลืออีก {reward.runsLeft} ครั้ง
            </p>
          )}
          {reward?.drops && (
            <p className="levelup">
              ได้{' '}
              {MATERIAL_IDS.filter((id) => reward.drops[id] > 0)
                .map((id) => `${MATERIALS[id].name} ${reward.drops[id]}`)
                .join(' · ')}
            </p>
          )}
          {reward?.quotaSpent && <p className="meta">ครบโควตาของวันนี้แล้ว รอบนี้ไม่ได้รางวัล</p>}
          {reward && !reward.firstClear && !reward.failed && !training && !gemStage && (
            <p className="meta">เคยผ่านด่านนี้แล้ว รอบนี้ไม่ได้เพชรเพิ่ม</p>
          )}
          {reward?.failed && (
            <div className="trace">{reward.why ?? 'บันทึกผลไม่สำเร็จ'}</div>
          )}
        </>
      ) : (
        <>
          {timedOut && (
            <p className="meta">
              หมดเวลาโดยที่ศัตรูยังเหลือเลือด {bossLeft}% แปลว่าทีมยังตีไม่แรงพอ
              ไม่ใช่ว่าอึดไม่พอ
            </p>
          )}
          <p>ลองจัดทีมใหม่หรือไปเก็บเลเวลจากลานฝึกดู</p>
        </>
      )}

      {won && nextStage && (
        <button className="rune-link block primary" onClick={onNext}>
          {nextStage.newDifficulty
            ? `เปิดโหมด${nextStage.newDifficulty} · เริ่มที่บทที่ 1`
            : `ไป${nextStage.name}`}
        </button>
      )}
      <button className="rune-link block" onClick={onAgain} disabled={noRunsLeft}>
        {noRunsLeft ? 'ครบโควตาวันนี้แล้ว' : 'เล่นอีกครั้ง'}
      </button>
      <button className="plain-link" onClick={onBack}>
        {backLabel ?? 'กลับไปแผนที่'}
      </button>
      </section>
    </div>
  )
}

function Missing({ message, onBack }) {
  return (
    <main className="screen">
      <div className="stage">
        <p className="meta center">{message}</p>
        {onBack && (
          <button className="rune-link block" onClick={onBack}>
            กลับไปแผนที่
          </button>
        )}
      </div>
    </main>
  )
}
