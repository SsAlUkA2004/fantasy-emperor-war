import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { redeemCode } from '../lib/codes'

export default function Redeem() {
  const { user, player, refresh } = usePlayer()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [won, setWon] = useState(null)

  const history = player.redeemed ?? []

  async function submit() {
    setBusy(true)
    setError(null)
    setWon(null)
    try {
      const r = await redeemCode({ ...player, uid: user.uid }, code)
      setWon(r)
      setCode('')
      await refresh()
    } catch (err) {
      setError(err.message || 'แลกไม่สำเร็จ')
    }
    setBusy(false)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>แลกโค้ด</h1>
            <p className="meta">กรอกโค้ดที่ได้รับมาเพื่อรับเพชร</p>
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        <div className="search-row">
          <input
            value={code}
            autoCapitalize="characters"
            spellCheck="false"
            placeholder="เช่น WELCOME2026"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && !busy && submit()}
          />
          <button className="rune-link" onClick={submit} disabled={busy || !code.trim()}>
            แลก
          </button>
        </div>

        {error && <div className="trace">{error}</div>}

        {won && (
          <div className="panel result">
            <div className="panel-head">แลกสำเร็จ</div>
            <p className="levelup">ได้เพชร {won.gems} เม็ด</p>
            {won.label && <p className="meta">{won.label}</p>}
          </div>
        )}

        <p className="meta tiny">โค้ดไม่แยกตัวพิมพ์เล็กใหญ่ และแลกได้คนละครั้งเดียวต่อโค้ด</p>

        {history.length > 0 && (
          <>
            <h2 className="section-title">โค้ดที่เคยแลก</h2>
            <div className="code-history">
              {history.map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
