import { useState } from 'react'
import { CHARACTERS, ELEMENTS, ROLES, STARTER_IDS } from '../data/characters'
import { chooseStarter } from '../lib/player'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/auth'

export default function ChooseStarter() {
  const { user, refresh } = usePlayer()
  const [picked, setPicked] = useState(STARTER_IDS[0])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const hero = CHARACTERS[picked]
  const element = ELEMENTS[hero.element]

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await chooseStarter(user.uid, picked)
      await refresh()
    } catch (err) {
      setError(explainError(err))
      setBusy(false)
    }
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>เลือกผู้ติดตามคนแรก</h1>
        <p>ทั้งสามคนแข็งแกร่งเท่ากัน แต่เล่นคนละแบบ เลือกแล้วเปลี่ยนไม่ได้</p>

        <div className="picker">
          {STARTER_IDS.map((id) => {
            const c = CHARACTERS[id]
            return (
              <button
                key={id}
                className="pick"
                data-active={id === picked}
                onClick={() => setPicked(id)}
              >
                <span className="pick-mark">{ELEMENTS[c.element].mark}</span>
                <span className="pick-name">{c.name}</span>
                <span className="pick-role">{ROLES[c.role]}</span>
              </button>
            )
          })}
        </div>

        <article className="dossier">
          <header>
            <h2>
              {hero.name}
              <span className="epithet">{hero.epithet}</span>
            </h2>
            <p className="meta">
              ธาตุ{element.name} · {ROLES[hero.role]} · ระดับ {hero.rarity}
            </p>
          </header>

          <p className="blurb">{hero.blurb}</p>

          <dl className="ledger">
            {[
              ['พลังชีวิต', hero.stats.hp],
              ['พลังโจมตี', hero.stats.atk],
              ['พลังป้องกัน', hero.stats.def],
              ['ความเร็ว', hero.stats.spd],
              ['โอกาสคริติคอล', hero.stats.crit + '%'],
            ].map(([label, value]) => (
              <div className="ledger-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="move">
            <h3>{hero.skill.name}</h3>
            <p>{hero.skill.desc}</p>
          </div>

          <div className="move ult">
            <h3>{hero.ultimate.name}</h3>
            <p>{hero.ultimate.desc}</p>
          </div>
        </article>

        {error && <div className="trace">{error}</div>}

        <button className="rune-link block" onClick={confirm} disabled={busy}>
          {busy ? 'กำลังบันทึก' : `เลือก${hero.name}`}
        </button>
      </div>
    </main>
  )
}
