import { useState } from 'react'
import { isConfigured } from '../firebase'
import { signIn, signUp, explainError, validatePassword, validateUsername } from '../lib/auth'
import Sigil from '../components/Sigil'

export default function TitleScreen() {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  async function submit() {
    const problem = validateUsername(username) || (isSignUp ? validatePassword(password) : null)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (isSignUp) await signUp(username, password)
      else await signIn(username, password)
      // PlayerContext จับการเปลี่ยนสถานะเองแล้วพาไปหน้าถัดไป
    } catch (err) {
      setError(explainError(err))
      setBusy(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') submit()
  }

  if (!isConfigured) {
    return (
      <main className="screen">
        <div className="stage">
          <section className="panel">
            <div className="panel-head">
              <span className="lamp" />
              ยังไม่ได้ตั้งค่า
            </div>
            <p>เปิดไฟล์ src/firebaseConfig.js แล้ววางค่าจาก Firebase Console ลงไปให้ครบทุกช่อง</p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="screen">
      <div className="stage">
        <div className="sigil-mount">
          <Sigil />
          <div className="crest">
            <h1 className="crest-th">ศึกจอมจักรพรรดิ</h1>
            <p className="crest-en">Fantasy Emperor War</p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">{isSignUp ? 'สร้างตัวละครใหม่' : 'กลับเข้าสู่อาณาจักร'}</div>

          <div className="field">
            <label htmlFor="username">ชื่อผู้ใช้</label>
            <input
              id="username"
              value={username}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="a-z, 0-9 และขีดล่าง"
            />
          </div>

          <div className="field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>

          {error && <div className="trace">{error}</div>}

          <button className="rune-link block" onClick={submit} disabled={busy}>
            {busy ? 'กำลังดำเนินการ' : isSignUp ? 'สมัครและเริ่มเล่น' : 'เข้าสู่ระบบ'}
          </button>

          <button
            className="plain-link"
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup')
              setError(null)
            }}
          >
            {isSignUp ? 'มีบัญชีอยู่แล้ว เข้าสู่ระบบ' : 'ยังไม่มีบัญชี สมัครสมาชิก'}
          </button>
        </section>

        <p className="tagline small">จำรหัสผ่านให้ดี ระบบนี้ไม่ใช้อีเมล จึงกู้รหัสผ่านคืนไม่ได้</p>
      </div>
    </main>
  )
}
