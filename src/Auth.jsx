import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

export function AuthSetup() {
  return (
    <main className="auth-page">
      <section className="auth-layout setup-layout">
        <header className="auth-brand"><span className="brand-mark"><MessageCircle size={19} strokeWidth={2.5} /></span><span className="brand-name">klartext<span>.</span></span></header>
        <div className="setup-content">
          <div className="auth-eyebrow"><LockKeyhole size={14} /> SICHERE ANMELDUNG</div>
          <h1>Supabase einrichten</h1>
          <p>Erstelle ein Supabase-Projekt, aktiviere die E-Mail-Bestätigung und hinterlege die Projekt-URL sowie den öffentlichen Schlüssel.</p>
          <ol className="setup-steps">
            <li><span>1</span><div><strong>Supabase-Projekt erstellen</strong><small>Ein Projekt unter supabase.com/dashboard anlegen und E-Mail-Anmeldung aktivieren.</small></div></li>
            <li><span>2</span><div><strong>Bestätigungslink konfigurieren</strong><small>Die Site URL und Redirect URL auf https://fred482.github.io/messenger/ setzen.</small></div></li>
            <li><span>3</span><div><strong>GitHub Actions Variablen hinzufügen</strong><small><code>VITE_SUPABASE_URL</code> und <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> unter Repository Settings → Secrets and variables → Actions → Variables eintragen.</small></div></li>
          </ol>
          <a className="primary-button setup-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase-Dashboard öffnen <ArrowRight size={16} /></a>
          <div className="modal-note setup-note"><ShieldCheck size={15} /><span>Nur URL und Publishable Key gehören in die Web-App. Niemals den Secret- oder service_role-Schlüssel veröffentlichen.</span></div>
        </div>
        <div className="setup-footer"><Mail size={14} /> Anmeldung mit E-Mail und Passwort, ohne 2FA</div>
      </section>
    </main>
  )
}

export function AuthScreen({ supabase }) {
  const [mode, setMode] = useState('sign-up')
  const [name, setName] = useState('')
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

    if (isSignUp && password !== passwordConfirmation) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setBusy(true)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
            data: { full_name: name.trim() },
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (!data.session) {
          setNotice('Öffne deine E-Mail und klicke auf den Bestätigungslink. Danach wirst du angemeldet.')
          setPassword('')
          setPasswordConfirmation('')
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
              <label>E-Mail-Adresse<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@beispiel.de" required /></label>
              <label>Passwort<input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignUp ? 'Mindestens 8 Zeichen' : 'Dein Passwort'} required /></label>
              {isSignUp && <label>Passwort bestätigen<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Passwort wiederholen" required /></label>}
              {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-feedback auth-success" role="status">{notice}</p>}
              <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Bitte warten …' : isSignUp ? 'Konto erstellen' : 'Anmelden'} <ArrowRight size={16} /></button>
            </form>
            <p className="auth-form-footnote"><ShieldCheck size={13} /> Die Anmeldung wird sicher von Supabase verwaltet.</p>
          </div>
        </div>
        <footer className="auth-footer"><span>KLARTEXT MESSENGER</span><span>Ohne Telefonnummer und 2FA</span></footer>
      </section>
    </main>
  )
}
