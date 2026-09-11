import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { heroStats, elementMatchup } from '../lib/stats'
import { heroPower, formatPower } from '../lib/power'
import { expToNext, levelCap, RARITY_CAPS, MAX_STAR } from '../lib/leveling'
import { loadCollection } from '../lib/player'
import { usePlayer } from '../context/PlayerContext'
import { ascend, nextStarCost } from '../lib/gacha'
import { upgradeSkill } from '../lib/crafting'
import {
  MATERIALS,
  MATERIAL_IDS,
  MAX_SKILL_LEVEL,
  EMPTY_BAG,
  canAfford,
  skillUpgradeCost,
  skillLevelScale,
} from '../data/materials'

function SkillUpgrade({ entry, player, busy, error, onUpgrade }) {
  const level = entry.skillLevel ?? 1
  const cost = skillUpgradeCost(level)
  const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }
  const enough = cost ? canAfford(bag, cost) : false

  return (
    <div className="skill-box">
      <div className="skill-line">
        <span className="hero-level">
          ระดับ {level} <span className="meta">/ {MAX_SKILL_LEVEL}</span>
        </span>
        <span className="meta">สกิลแรงขึ้น {Math.round((skillLevelScale(level) - 1) * 100)}%</span>
      </div>

      <div className="pip-track">
        {[...Array(MAX_SKILL_LEVEL)].map((_, i) => (
          <span className="pip" key={i} data-on={i < level} />
        ))}
      </div>

      {cost === null ? (
        <p className="meta">ถึงระดับสูงสุดแล้ว</p>
      ) : (
        <>
          <div className="cost-row">
            {MATERIAL_IDS.filter((id) => cost[id] > 0).map((id) => (
              <span className="cost-item" key={id} data-short={(bag[id] ?? 0) < cost[id]}>
                {MATERIALS[id].mark} {bag[id] ?? 0}/{cost[id]}
              </span>
            ))}
          </div>
          {error && <div className="trace">{error}</div>}
          <button className="rune-link block" disabled={busy || !enough} onClick={onUpgrade}>
            {enough ? `ยกระดับเป็น ${level + 1}` : 'วัสดุไม่พอ'}
          </button>
        </>
      )}
    </div>
  )
}

export default function Hero() {
  const { charId } = useParams()
  const navigate = useNavigate()
  const { user, player, refresh } = usePlayer()
  const [entry, setEntry] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [skillBusy, setSkillBusy] = useState(false)
  const [skillError, setSkillError] = useState(null)

  const c = CHARACTERS[charId]

  useEffect(() => {
    loadCollection(user.uid).then((owned) => setEntry(owned.find((o) => o.id === charId) ?? null))
  }, [charId, user.uid])

  if (!c) {
    return (
      <main className="screen">
        <div className="stage">
          <p className="meta center">ไม่พบตัวละครนี้</p>
        </div>
      </main>
    )
  }

  const level = entry?.level ?? 1
  const star = entry?.star ?? 1
  const stats = heroStats(charId, level, star)
  const element = ELEMENTS[c.element]
  const { strongAgainst, weakTo } = elementMatchup(c.element)
  const cap = levelCap(c.rarity, star)
  const capped = level >= cap
  const rarityCap = RARITY_CAPS[c.rarity]

  return (
    <main className="screen top">
      <div className="sheet">
        <button className="plain-link back" onClick={() => navigate(-1)}>
          กลับ
        </button>

        <header className="hero-head">
          <span className="hero-mark">{element.mark}</span>
          <div>
            <h1>{c.name}</h1>
            <p className="meta">{c.epithet}</p>
          </div>
        </header>

        <p className="meta chips">
          <span className="chip">ธาตุ{element.name}</span>
          <span className="chip">{ROLES[c.role]}</span>
          <span className="chip gold">{c.rarity}</span>
          <span className="chip">{'★'.repeat(star)}</span>
        </p>

        {entry === undefined && <p className="meta">กำลังอ่านข้อมูล</p>}

        {entry === null && (
          <p className="meta">ยังไม่มีตัวละครนี้ ค่าที่แสดงเป็นค่าพื้นฐานที่เลเวล 1</p>
        )}

        {entry && (
          <section className="exp-block">
            <div className="exp-line">
              <span className="hero-level">
                เลเวล {level} <span className="meta">/ {cap}</span>
              </span>
              <span className="meta">
                {capped ? 'ตันที่เพดานแล้ว' : `${entry.exp} / ${expToNext(level)}`}
              </span>
            </div>
            {!capped && (
              <div className="bar">
                <span style={{ width: `${Math.round((entry.exp / expToNext(level)) * 100)}%` }} />
              </div>
            )}
          </section>
        )}

        <div className="cp-banner">
          <span className="meta">ค่าพลังรวม</span>
          <strong>⚔ {formatPower(heroPower(charId, level, star))}</strong>
        </div>

        <h2 className="section-title">ค่าพลัง</h2>
        <dl className="ledger">
          {[
            ['พลังชีวิต', stats.hp],
            ['พลังโจมตี', stats.atk],
            ['พลังป้องกัน', stats.def],
            ['ความเร็ว', stats.spd],
            ['โอกาสคริติคอล', stats.crit + '%'],
          ].map(([label, value]) => (
            <div className="ledger-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="meta tiny">ค่าพลังเพิ่มขึ้น 8% ต่อเลเวล และ 15% ต่อดาว สกิลแรงขึ้น 10% ต่อดาว</p>

        <h2 className="section-title">การทะลุเลเวล</h2>
        <p className="meta">
          ตัวละครระดับ {c.rarity} ตันที่เลเวล {rarityCap.base} เมื่อมีดาวเดียว
          เพิ่มดาวได้ถึง {MAX_STAR} ดาว ซึ่งดันเพดานไปถึง {rarityCap.ascended}
        </p>
        <div className="star-track">
          {[...Array(MAX_STAR)].map((_, i) => (
            <div className="star-step" key={i} data-reached={i < star}>
              <span className="star-mark">★</span>
              <span className="meta tiny">{levelCap(c.rarity, i + 1)}</span>
            </div>
          ))}
        </div>
        {entry && (
          <div className="ascend">
            <div className="ledger-row">
              <dt>ชิ้นส่วนที่มี</dt>
              <dd>
                {entry.shards ?? 0}
                {nextStarCost(star) !== null && ` / ${nextStarCost(star)}`}
              </dd>
            </div>
            {error && <div className="trace">{error}</div>}
            {nextStarCost(star) === null ? (
              <p className="meta">ดาวเต็มแล้ว</p>
            ) : (
              <button
                className="rune-link block"
                disabled={busy || (entry.shards ?? 0) < nextStarCost(star)}
                onClick={async () => {
                  setBusy(true)
                  setError(null)
                  try {
                    const next = await ascend(user.uid, { ...entry, id: charId })
                    setEntry({ ...entry, ...next })
                  } catch (e) {
                    setError(e.message || 'หลอมไม่สำเร็จ')
                  }
                  setBusy(false)
                }}
              >
                หลอมเป็น {star + 1} ดาว
              </button>
            )}
          </div>
        )}
        <p className="meta tiny">
          ชิ้นส่วนได้จากการสุ่มกาชาแล้วเจอตัวซ้ำ ตัวซ้ำระดับ R ให้ 5 ชิ้น SR ให้ 20 SSR ให้ 50
        </p>

        <h2 className="section-title">ระดับสกิล</h2>
        {entry ? (
          <SkillUpgrade
            entry={{ ...entry, id: charId }}
            player={player}
            uid={user.uid}
            busy={skillBusy}
            error={skillError}
            onUpgrade={async () => {
              setSkillBusy(true)
              setSkillError(null)
              try {
                const r = await upgradeSkill({ ...player, uid: user.uid }, { ...entry, id: charId })
                setEntry({ ...entry, skillLevel: r.skillLevel })
                await refresh()
              } catch (err) {
                setSkillError(err.message || 'อัปเกรดไม่สำเร็จ')
              }
              setSkillBusy(false)
            }}
          />
        ) : (
          <p className="meta">ต้องมีตัวละครนี้ก่อนจึงจะอัปเกรดสกิลได้</p>
        )}

        <h2 className="section-title">ท่าที่ใช้ได้</h2>

        <div className="move">
          <h3>โจมตี</h3>
          <p>ดาเมจ 100% ใช้ได้ทุกเทิร์นโดยไม่เสียอะไร เพิ่มเกจไม้ตาย 25</p>
        </div>

        <div className="move">
          <h3>{c.skill.name}</h3>
          <p>{c.skill.desc}</p>
          <p className="cost">ใช้พลังเวท {c.skill.mp} · ได้คืนเทิร์นละ 2 · เพิ่มเกจ 15</p>
        </div>

        <div className="move ult">
          <h3>{c.ultimate.name}</h3>
          <p>{c.ultimate.desc}</p>
          <p className="cost">ใช้ได้เมื่อเกจครบ 100 แล้วเกจกลับเป็น 0</p>
        </div>

        <h2 className="section-title">ธาตุ</h2>
        <div className="matchup">
          <div className="matchup-row">
            <span className="meta">ตีแรงใส่</span>
            <span className="chip good">
              {strongAgainst ? `${ELEMENTS[strongAgainst].mark} ธาตุ${ELEMENTS[strongAgainst].name}` : '—'}
            </span>
          </div>
          <div className="matchup-row">
            <span className="meta">โดนตีแรงจาก</span>
            <span className="chip bad">
              {weakTo ? `${ELEMENTS[weakTo].mark} ธาตุ${ELEMENTS[weakTo].name}` : '—'}
            </span>
          </div>
        </div>
        <p className="meta tiny">ฝ่ายที่ได้เปรียบธาตุจะสร้างดาเมจเพิ่มขึ้น 30%</p>

        <p className="blurb">{c.blurb}</p>
      </div>
    </main>
  )
}
