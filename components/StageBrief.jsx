import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, ROLES, TEAM_SIZE } from '../data/characters'
import { rankRoster, readStage, stageTips } from '../lib/advisor'
import { loadCollection } from '../lib/player'
import { teamPower, stagePower, matchup, formatPower, entryPower } from '../lib/power'
import { explainError } from '../lib/errors'
import { HELPER_RUNS_PER_DAY, helperRunsLeft, loadHelpers } from '../lib/helper'

/**
 * ป๊อปอัพก่อนเข้าด่าน
 *
 * ทำหน้าที่สองอย่างพร้อมกัน คือบอกว่าด่านนี้มีอะไรรออยู่
 * และให้จัดทีมใหม่ได้ตรงนั้นเลยโดยไม่ต้องออกไปหน้าจัดทีมแล้วเดินกลับมา
 *
 * รายชื่อตัวละครเรียงตามคะแนนที่ตัวแนะนำคำนวณให้ ตัวที่เหมาะกับด่านนี้จึงอยู่บนสุด
 * ไม่ใช่เรียงตามค่าพลังดิบซึ่งไม่ได้บอกว่าเข้ากับด่านหรือเปล่า
 */
export default function StageBrief({ stage, onStart, onClose }) {
  const { user, player, refresh } = usePlayer()
  const [roster, setRoster] = useState(null)
  const [picks, setPicks] = useState(player.team ?? [])
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [helpers, setHelpers] = useState(null)
  const [helper, setHelper] = useState(null)

  // ยืมตัวช่วยได้เฉพาะด่านผจญภัยกับดันเจี้ยน ไม่ใช่ประลองหรือบอส
  const canBorrow = !stage.charDungeon && !stage.gemStage && helperRunsLeft(player) > 0

  useEffect(() => {
    if (canBorrow) loadHelpers(user.uid).then(setHelpers).catch(() => setHelpers([]))
  }, [canBorrow])
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setRoster)
  }, [user.uid])

  const info = readStage(stage)
  const tips = stageTips(stage)
  const ranked = roster ? rankRoster(roster, stage) : []
  const chosen = roster ? picks.map((id) => roster.find((o) => o.id === id)).filter(Boolean) : []
  const mine = teamPower(chosen)
  const foePower = stagePower(stage)
  const m = matchup(mine, foePower)
  const dirty = JSON.stringify(picks) !== JSON.stringify(player.team ?? [])

  function toggle(id) {
    setPicks((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id)
      if (t.length >= TEAM_SIZE) return t
      return [...t, id]
    })
  }

  async function start() {
    if (!picks.length) {
      setError('ต้องมีอย่างน้อยหนึ่งตัวในทีม')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (dirty) {
        await updateDoc(doc(db, 'users', user.uid), { team: picks })
        await refresh()
      }
      onStart(helper)
    } catch (e) {
      setError(explainError('บันทึกทีมไม่สำเร็จ', e))
      setSaving(false)
    }
  }

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup brief">
        <div className="panel-head">{stage.name}</div>

        <div className="brief-foes">
          {info.foes.map((f, i) => (
            <span className="foe-chip" key={i}>
              {ELEMENTS[f.element].mark} {f.name}
            </span>
          ))}
        </div>

        {foePower > 0 && (
          <div className="cp-banner brief-cp">
            <span className="meta">
              ทีม ⚔ {formatPower(mine)} · ศัตรู ⚔ {formatPower(foePower)}
            </span>
            <strong className="power-label" data-level={m.level}>
              {m.label}
            </strong>
          </div>
        )}

        <h3 className="section-title">คำแนะนำ</h3>
        <ul className="tip-list">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>

        {canBorrow && helpers?.length > 0 && (
          <>
            <h3 className="section-title">ยืมตัวช่วย · วันนี้เหลือ {helperRunsLeft(player)} ครั้ง</h3>
            <p className="meta tiny">
              ตัวที่ยืมมาสู้ให้เป็นตัวที่หก ไม่กินช่องทีม เลือกจากผู้เล่นค่าพลังสูงสุดในเซิร์ฟเวอร์
            </p>
            <div className="helper-row">
              {helpers.map((h) => (
                <button
                  key={h.uid}
                  className="helper-chip"
                  data-active={helper?.uid === h.uid}
                  onClick={() => setHelper(helper?.uid === h.uid ? null : h)}
                >
                  <span className="helper-name">{h.name}</span>
                  <span className="meta tiny">
                    ⚔ {formatPower(h.power)} · {h.username}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <h3 className="section-title">ทีมที่จะพาไป</h3>
        <div className="team-strip-slots">
          {[...Array(TEAM_SIZE)].map((_, i) => {
            const c = picks[i] ? CHARACTERS[picks[i]] : null
            return (
              <div className="mini-slot" key={i} data-filled={Boolean(c)}>
                {c ? (
                  <>
                    <span className="mini-mark">{ELEMENTS[c.element].mark}</span>
                    <span className="mini-name">{c.name}</span>
                  </>
                ) : (
                  <span className="mini-empty">ว่าง</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="roster-head">
          <h3 className="section-title flush">แนะนำสำหรับด่านนี้</h3>
          <button className="plain-link inline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'ดูเฉพาะที่แนะนำ' : `ดูทั้งหมด (${ranked.length})`}
          </button>
        </div>
        {roster === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

        <div className="advice-list">
          {(showAll ? ranked : ranked.slice(0, 12)).map(({ entry, char, score, reasons }, i) => {
            const picked = picks.includes(entry.id)
            return (
              <button
                key={entry.id}
                className="advice-row"
                data-picked={picked}
                data-top={i < 3}
                onClick={() => toggle(entry.id)}
              >
                <span className="advice-rank">{i + 1}</span>
                <span className="card-mark">{ELEMENTS[char.element].mark}</span>
                <span className="advice-body">
                  <span className="advice-name">
                    {char.name}
                    <span className="rarity" data-rarity={char.rarity}>
                      {char.rarity}
                    </span>
                  </span>
                  <span className="meta tiny">
                    {ROLES[char.role]} · เลเวล {entry.level} · ⚔ {formatPower(entryPower(entry))}
                  </span>
                  {reasons.length > 0 && (
                    <span className="advice-why">{reasons.join(' · ')}</span>
                  )}
                </span>
                <span className="advice-pick">{picked ? 'อยู่ในทีม' : 'ใส่'}</span>
              </button>
            )
          })}
        </div>

        {error && <div className="trace">{error}</div>}

        <button className="rune-link block primary" onClick={start} disabled={saving}>
          {saving ? 'กำลังเข้าด่าน' : dirty ? 'บันทึกทีมแล้วเริ่ม' : 'เริ่มต่อสู้'}
        </button>
        <button className="plain-link" onClick={onClose}>
          ปิด
        </button>
      </section>
    </div>
  )
}
