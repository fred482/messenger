import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

export function AuthScreen({ supabase }) {
  const [mode, setMode] = useState('sign-up')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'sign-up'

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
    setPasswordConfirmation('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!supabase) {
      setError('Die Anmeldung ist noch nicht eingerichtet.')
      return
    }

    if (isSignUp && password !== passwordConfirmation) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    const normalizedUsername = username.trim().toLowerCase()
    if (isSignUp && !/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setError('Der Benutzername muss 3–24 Zeichen lang sein und darf nur Buchstaben, Zahlen und _ enthalten.')
      return
    }

    setBusy(true)

    try {
      if (isSignUp) {
        const { data: usernameAvailable, error: usernameError } = await supabase.rpc('is_username_available', {
          candidate_username: normalizedUsername,
        })

        if (usernameError) {
          setError(usernameError.message)
          return
        }

        if (!usernameAvailable) {
          setError('Dieser Benutzername ist bereits vergeben.')
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
            data: { full_name: name.trim(), username: normalizedUsername },
          },
        })

        if (signUpError) {
          setError(signUpError.code === '23505' || signUpError.message.includes('USERNAME_TAKEN')
            ? 'Dieser Benutzername ist bereits vergeben.'
            : signUpError.message)
          return
        }

        if (!data.session) {
          setNotice('Öffne deine E-Mail und klicke auf den Bestätigungslink. Danach wirst du angemeldet.')
          setPassword('')
          setPasswordConfirmation('')
          setUsername('')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          setError(signInError.code === 'email_not_confirmed'
            ? 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deinem Postfach.'
            : signInError.message)
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ein unbekannter Fehler bei der Anmeldung ist aufgetreten.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <header className="auth-brand"><span className="brand-mark"><MessageCircle size={19} strokeWidth={2.5} /></span><span className="brand-name">klartext<span>.</span></span></header>
        <div className="auth-grid">
          <div className="auth-copy">
            <div className="auth-eyebrow"><LockKeyhole size={14} /> PRIVAT VERBUNDEN</div>
            <h1>{isSignUp ? 'Dein Konto. Deine Privatsphäre.' : 'Schön, dass du da bist.'}</h1>
            <p>Mit deiner E-Mail-Adresse und einem Passwort anmelden. Eine Telefonnummer oder 2FA brauchst du nicht.</p>
            <div className="auth-promise"><span><Mail size={17} /></span><div><strong>E-Mail statt Handynummer</strong><small>Deine Adresse ist deine Anmeldung.</small></div></div>
            <div className="auth-promise"><span><ShieldCheck size={18} /></span><div><strong>Bestätigung per E-Mail</strong><small>Ein Link bestätigt dein Konto.</small></div></div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-mode-switch" role="tablist" aria-label="Anmeldemodus">
              <button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''} onClick={() => changeMode('sign-in')}>Anmelden</button>
              <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => changeMode('sign-up')}>Konto erstellen</button>
            </div>
            <form className="modal-form auth-form" onSubmit={handleSubmit}>
              {isSignUp && <label>Name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Dein Name" required /></label>}
              {isSignUp && <label>Benutzername<input type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="z.B. max_muster" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required /></label>}
              <label>E-Mail-Adresse<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@beispiel.de" required /></label>
              <label>Passwort<input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignUp ? 'Mindestens 8 Zeichen' : 'Dein Passwort'} required /></label>
              {isSignUp && <label>Passwort bestätigen<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Passwort wiederholen" required /></label>}
              {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-feedback auth-success" role="status">{notice}</p>}
              <button className="primary-button" type="submit" disabled={busy || !supabase}>{busy ? 'Bitte warten …' : !supabase ? 'Demnächst verfügbar' : isSignUp ? 'Konto erstellen' : 'Anmelden'} <ArrowRight size={16} /></button>
            </form>
            <p className="auth-form-footnote"><ShieldCheck size={13} /> Die Anmeldung wird sicher von Supabase verwaltet.</p>
          </div>
        </div>
        <footer className="auth-footer"><span>KLARTEXT MESSENGER</span><span>Ohne Telefonnummer und 2FA</span></footer>
      </section>
    </main>
  )
}
