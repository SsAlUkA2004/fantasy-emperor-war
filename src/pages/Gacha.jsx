import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { PULL_COST, TEN_PULL_COST, PITY_SR, PITY_SSR, RATES, pull } from '../lib/gacha'

export default function Gacha() {
  const { user, player, refresh } = usePlayer()
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const sinceSR = player.pitySR ?? 0
  const sinceSSR = player.pitySSR ?? 0

  async function roll(count) {
    const cost = count === 10 ? TEN_PULL_COST : PULL_COST
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pull({ ...player, uid: user.uid }, count)
      setResults(r.summary)
      await refresh()
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : 'สุ่มไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง')
    }
    setBusy(false)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>ประตูอัญเชิญ</h1>
            <p className="meta">
              โอกาสออก R {Math.round(RATES.R * 100)}% · SR {Math.round(RATES.SR * 100)}% · SSR{' '}
              {Math.round(RATES.SSR * 100)}%
            </p>
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        <section className="pity">
          <div className="pity-row">
            <span className="meta">อีก {Math.max(0, PITY_SR - sinceSR)} ครั้งได้ SR ขึ้นไปแน่นอน</span>
            <div className="bar thin wide">
              <span style={{ width: `${(sinceSR / PITY_SR) * 100}%` }} />
            </div>
          </div>
          <div className="pity-row">
            <span className="meta">อีก {Math.max(0, PITY_SSR - sinceSSR)} ครั้งได้ SSR แน่นอน</span>
            <div className="bar thin wide">
              <span style={{ width: `${(sinceSSR / PITY_SSR) * 100}%` }} />
            </div>
          </div>
        </section>

        {error && <div className="trace">{error}</div>}

        <div className="pull-row">
          <button className="rune-link" disabled={busy} onClick={() => roll(1)}>
            สุ่ม 1 ครั้ง · {PULL_COST}
          </button>
          <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
            สุ่ม 10 ครั้ง · {TEN_PULL_COST}
          </button>
        </div>
        <p className="meta tiny center">สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร</p>

        {busy && <p className="meta center">กำลังอัญเชิญ</p>}

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {results && (
        <PullResult
          results={results}
          count={lastCount}
          gems={player.gems}
          busy={busy}
          onAgain={() => roll(lastCount)}
          onClose={() => setResults(null)}
        />
      )}
    </main>
  )
}

const RARITY_ORDER = { SSR: 0, SR: 1, R: 2 }

function PullResult({ results, count, gems, busy, onAgain, onClose }) {
  // เรียงของหายากขึ้นก่อน เพราะสิ่งที่ผู้เล่นอยากรู้ที่สุดคือได้ SSR ไหม
  const sorted = [...results].sort(
    (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  )
  const best = sorted[0]?.rarity ?? 'R'
  const tally = results.reduce((acc, r) => {
    acc[r.rarity] = (acc[r.rarity] ?? 0) + 1
    return acc
  }, {})
  const again = count === 10 ? TEN_PULL_COST : PULL_COST

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup pull-popup" data-best={best}>
        <div className="panel-head">
          {best === 'SSR' ? 'ได้ตัวระดับตำนาน' : best === 'SR' ? 'ได้ตัวหายาก' : 'ผลการอัญเชิญ'}
        </div>

        <p className="meta tally">
          {['SSR', 'SR', 'R'].filter((r) => tally[r]).map((r) => `${r} ${tally[r]} ตัว`).join(' · ')}
        </p>

        <div className="pull-grid">
          {sorted.map((r, i) => {
            const c = CHARACTERS[r.id]
            return (
              <Link
                className="pull-card reveal"
                to={`/hero/${r.id}`}
                data-rarity={r.rarity}
                style={{ animationDelay: `${i * 90}ms` }}
                key={i}
              >
                <span className="pull-mark">{ELEMENTS[c.element].mark}</span>
                <span className="pull-name">{c.name}</span>
                <span className="pull-role">{ROLES[c.role]}</span>
                <span className="pull-tag">
                  {r.isNew ? 'ตัวใหม่' : `ซ้ำ +${r.shards} ชิ้นส่วน`}
                </span>
              </Link>
            )
          })}
        </div>

        <p className="meta tiny">แตะการ์ดเพื่อดูรายละเอียดตัวละคร</p>

        <button className="rune-link block primary" onClick={onAgain} disabled={busy || gems < again}>
          {gems < again ? 'เพชรไม่พอสุ่มอีก' : `สุ่มอีก ${count} ครั้ง · ${again}`}
        </button>
        <button className="plain-link" onClick={onClose}>
          ปิด
        </button>
      </section>
    </div>
  )
}
