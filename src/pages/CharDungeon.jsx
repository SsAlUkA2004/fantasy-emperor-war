import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import {
  DROP_RATE,
  RUNS_PER_SLOT,
  hourIndex,
  hourStartsAt,
  minutesLeft,
  roundFor,
  schedule,
  slotStage,
} from '../data/chardungeon'
import { ELEMENTS, FOCUS, ROLES } from '../data/characters'
import { runsLeftFor } from '../lib/chardungeon'
import { loadCollection } from '../lib/player'
import StageBrief from '../components/StageBrief'

export default function CharDungeon() {
  const { user, player } = usePlayer()
  const navigate = useNavigate()
  const [owned, setOwned] = useState(null)
  const [hour, setHour] = useState(hourIndex())
  const [brief, setBrief] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  // ข้ามชั่วโมงแล้วรีเฟรชตารางเอง ไม่ต้องให้ผู้เล่นกดโหลดใหม่
  useEffect(() => {
    const t = setInterval(() => setHour(hourIndex()), 30000)
    return () => clearInterval(t)
  }, [])

  const round = roundFor(hour)
  const ahead = schedule(3, hour).slice(1)
  const has = (id) => owned?.some((o) => o.id === id)

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <h1>ดันเจี้ยนรอยอดีต</h1>
        <p className="meta">
          หกด่านต่อรอบ เปลี่ยนตัวละครทุกชั่วโมง · รอบนี้เหลืออีก {minutesLeft(hour)} นาที
        </p>
        <p className="meta tiny">
          ด่านละ {RUNS_PER_SLOT} ครั้งต่อรอบ · โอกาสได้ตัว R {DROP_RATE.R * 100}% · SR{' '}
          {DROP_RATE.SR * 100}% · SSR {DROP_RATE.SSR * 100}% · ตัวที่มีแล้วจะได้เศษวิญญาณแทน
        </p>

        <h2 className="section-title">รอบนี้</h2>
        <div className="stage-list">
          {round.slots.map((s) => {
            const left = runsLeftFor(player, s.slot, hour)
            const owned_ = has(s.charId)
            return (
              <button
                key={s.slot}
                className="stage-row"
                data-locked={left === 0}
                data-boss={s.rarity === 'SSR'}
                disabled={left === 0}
                onClick={() => setBrief(slotStage(s, hour))}
              >
                <span className="stage-id">{ELEMENTS[s.char.element].mark}</span>
                <span className="stage-body">
                  <span className="stage-name">
                    {s.char.name}
                    <span className="rarity" data-rarity={s.rarity}>
                      {s.rarity}
                    </span>
                    {owned_ && <span className="chip">มีแล้ว</span>}
                  </span>
                  <span className="meta">
                    {ROLES[s.char.role]}
                    {s.char.focus && FOCUS[s.char.focus] && ` · ${FOCUS[s.char.focus].name}`}
                  </span>
                  <span className="meta tiny">
                    เหลือ {left} จาก {RUNS_PER_SLOT} ครั้ง · โอกาส{' '}
                    {(DROP_RATE[s.rarity] * 100).toFixed(s.rarity === 'SSR' ? 0 : 0)}%
                  </span>
                </span>
                <span className="stage-stars">{left === 0 ? 'ครบแล้ว' : ''}</span>
              </button>
            )
          })}
        </div>

        <h2 className="section-title">ตารางล่วงหน้า</h2>
        <p className="meta">ดูไว้วางแผนว่าจะกลับมาเล่นตอนไหน</p>

        {ahead.map((r) => (
          <article className="ahead-row" key={r.hour}>
            <header className="ahead-head">
              <span className="hero-level">
                {hourStartsAt(r.hour).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="meta tiny">อีก {r.hour - hour} ชั่วโมง</span>
            </header>
            <div className="ahead-list">
              {r.slots.map((s) => (
                <span className="ahead-chip" key={s.slot} data-rarity={s.rarity}>
                  {ELEMENTS[s.char.element].mark} {s.char.name}
                  <span className="ahead-rarity">{s.rarity}</span>
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {brief && (
        <StageBrief
          stage={brief}
          onStart={() => navigate(`/battle/${brief.id}`)}
          onClose={() => setBrief(null)}
        />
      )}
    </main>
  )
}
