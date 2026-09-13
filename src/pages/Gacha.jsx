import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { BANNERS, CHARACTERS, ELEMENTS, FOCUS, ROLES, bannerPool } from '../data/characters'
import {
  PULL_COST,
  TEN_PULL_COST,
  PITY_SR,
  PITY_SSR,
  discountAvailable,
  discountedPullCost,
  effectiveRates,
  pull,
} from '../lib/gacha'
import { loadCollection } from '../lib/player'

export default function Gacha() {
  const { user, player, refresh } = usePlayer()
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [banner, setBanner] = useState(BANNERS[0].id)
  const [owned, setOwned] = useState(null)
  const [showPool, setShowPool] = useState(false)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pool = bannerPool(banner)
  const rates = effectiveRates(pool)
  const inBanner = BANNERS.find((b) => b.id === banner)?.ids ?? []
  const hasChar = (id) => owned?.some((o) => o.id === id) ?? false

  const discount = discountAvailable(player)
  const singleCost = discount ? discountedPullCost() : PULL_COST

  const sinceSR = player.pitySR ?? 0
  const sinceSSR = player.pitySSR ?? 0

  async function roll(count) {
    const cost = count === 10 ? TEN_PULL_COST : singleCost
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pull({ ...player, uid: user.uid }, count, banner)
      setResults(r.summary)
      await refresh()
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : explainError('สุ่มไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <header className="lobby-head">
          <div>
            <h1>ประตูอัญเชิญ</h1>
            <p className="meta">
              โอกาสออกในตู้นี้ ·{' '}
              {['R', 'SR', 'SSR']
                .filter((r) => rates[r] > 0)
                .map((r) => `${r} ${(rates[r] * 100).toFixed(rates[r] < 0.05 ? 0 : 0)}%`)
                .join(' · ')}
            </p>
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        <div className="mode-tabs banner-tabs">
          {BANNERS.map((b) => (
            <button
              key={b.id}
              className="mode-tab"
              data-active={banner === b.id}
              onClick={() => setBanner(b.id)}
            >
              {b.name}
              <span className="mode-count">{b.ids.length}</span>
            </button>
          ))}
        </div>
        <p className="meta">{BANNERS.find((b) => b.id === banner)?.desc}</p>
        <p className="meta tiny">
          ตู้นี้มี SSR {pool.SSR.length} ตัว · SR {pool.SR.length} ตัว · R {pool.R.length} ตัว ·
          ตัวนับการันตีใช้ร่วมกันทั้งสองตู้
          {pool.R.length === 0 && ' · ตู้นี้ไม่มีตัวระดับ R โอกาสที่ควรออก R จึงเลื่อนขึ้นเป็น SR ทั้งหมด'}
        </p>

        <div className="roster-head">
          <span className="meta">
            ในตู้นี้คุณมีแล้ว {inBanner.filter((id) => hasChar(id)).length} จาก {inBanner.length} ตัว
          </span>
          <button className="plain-link inline" onClick={() => setShowPool((v) => !v)}>
            {showPool ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อในตู้'}
          </button>
        </div>

        {showPool && (
          <div className="pool-grid">
            {inBanner.map((id) => {
              const c = CHARACTERS[id]
              const mine = hasChar(id)
              return (
                <span className="pool-chip" key={id} data-owned={mine} data-rarity={c.rarity}>
                  {mine ? ELEMENTS[c.element].mark : '❔'} {mine ? c.name : '???'}
                  <span className="pool-rarity">{c.rarity}</span>
                </span>
              )
            })}
          </div>
        )}

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
          <button className="rune-link" disabled={busy} onClick={() => roll(1)} data-deal={discount}>
            สุ่ม 1 ครั้ง · {singleCost}
            {discount && <span className="deal-tag">ครั้งแรกของวัน ลด 50%</span>}
          </button>
          <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
            สุ่ม 10 ครั้ง · {TEN_PULL_COST}
          </button>
        </div>
        <p className="meta tiny center">สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร</p>

        {busy && <p className="meta center">กำลังอัญเชิญ</p>}

        <div className="gate">
          <Link className="rune-link" to="/collection">
            หอสะสมฮีโร่
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
