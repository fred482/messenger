import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { defaultSiteSettings } from './siteSettings.js'

export function AuthScreen({ supabase, siteSettings = defaultSiteSettings, demoMode = false, onDemoContinue }) {
  const [mode, setMode] = useState('sign-up')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [authMethod, setAuthMethod] = useState('email')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
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
    setOtp('')
    setPendingPhone('')
  }

  function changeAuthMethod(nextMethod) {
    setAuthMethod(nextMethod)
    setError('')
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!supabase) {
      if (!demoMode) {
        setError('Die Anmeldung ist noch nicht eingerichtet.')
        return
      }

      if (isSignUp) {
        if (password !== passwordConfirmation) {
          setError('Die Passwörter stimmen nicht überein.')
          return
        }
        if (!/^[a-z0-9_]{3,24}$/.test(username.trim().toLowerCase())) {
          setError('Der Benutzername muss 3–24 Zeichen lang sein und darf nur Buchstaben, Zahlen und _ enthalten.')
          return
        }
        if (authMethod === 'phone') {
          const normalizedPhone = phone.trim().replace(/[\s()-]/g, '')
          if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
            setError('Bitte gib die Nummer im internationalen Format ein, zum Beispiel +491761234567.')
            return
          }
          setPendingPhone(normalizedPhone)
          setNotice('Demo-Modus: Gib einen beliebigen sechsstelligen Code ein.')
          setPassword('')
          setPasswordConfirmation('')
          return
        }
        onDemoContinue?.()
        return
      }

      onDemoContinue?.()
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

        const normalizedPhone = phone.trim().replace(/[\s()-]/g, '')
        if (authMethod === 'phone' && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
          setError('Bitte gib die Nummer im internationalen Format ein, zum Beispiel +491761234567.')
          return
        }

        const signUpPayload = authMethod === 'phone'
          ? {
              phone: normalizedPhone,
              password,
              options: { data: { full_name: name.trim(), username: normalizedUsername } },
            }
          : {
              email: email.trim(),
              password,
              options: {
                emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
                data: { full_name: name.trim(), username: normalizedUsername },
              },
            }

        const { data, error: signUpError } = await supabase.auth.signUp(signUpPayload)

        if (signUpError) {
          setError(signUpError.code === '23505' || signUpError.message.includes('USERNAME_TAKEN')
            ? 'Dieser Benutzername ist bereits vergeben.'
            : signUpError.message)
          return
        }

        if (!data.session) {
          if (authMethod === 'phone') {
            setPendingPhone(normalizedPhone)
            setNotice('Gib den sechsstelligen Code aus der SMS ein.')
          } else {
            setNotice('Öffne deine E-Mail und klicke auf den Bestätigungslink. Danach wirst du angemeldet.')
          }
          setPassword('')
          setPasswordConfirmation('')
          setUsername('')
        }
      } else {
        const signInPayload = authMethod === 'phone'
          ? { phone: phone.trim().replace(/[\s()-]/g, ''), password }
          : { email: email.trim(), password }
        const { error: signInError } = await supabase.auth.signInWithPassword(signInPayload)

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

  async function verifyPhoneOtp(event) {
    event.preventDefault()
    if (demoMode) {
      if (otp.length !== 6) {
        setError('Bitte gib einen sechsstelligen Code ein.')
        return
      }
      onDemoContinue?.()
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: otp.trim(),
        type: 'sms',
      })
      if (verifyError) {
        setError(verifyError.message)
        return
      }
      setOtp('')
      setPendingPhone('')
    } catch (verifyCatchError) {
      setError(verifyCatchError instanceof Error ? verifyCatchError.message : 'Der SMS-Code konnte nicht geprüft werden.')
    } finally {
      setBusy(false)
    }
  }

  async function resendPhoneOtp() {
    if (demoMode) {
      setError('')
      setNotice('Demo-Modus: Ein neuer Code ist nicht erforderlich. Jeder sechsstellige Code funktioniert.')
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'sms', phone: pendingPhone })
      if (resendError) {
        setError(resendError.message)
        return
      }
      setNotice('Ein neuer SMS-Code wurde gesendet.')
    } catch (resendCatchError) {
      setError(resendCatchError instanceof Error ? resendCatchError.message : 'Die SMS konnte nicht erneut gesendet werden.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page" style={{ '--green': siteSettings.accent_color }}>
      <section className="auth-layout">
        <header className="auth-brand"><span className="brand-mark">{siteSettings.logo_text || <MessageCircle size={19} strokeWidth={2.5} />}</span><span className="brand-name">{siteSettings.brand_name}<span>.</span></span></header>
        <div className="auth-grid">
          <div className="auth-copy">
            <div className="auth-eyebrow"><LockKeyhole size={14} /> PRIVAT VERBUNDEN</div>
            <h1>{isSignUp ? siteSettings.auth_heading : 'Schön, dass du da bist.'}</h1>
            <p>{siteSettings.auth_description}</p>
            <div className="auth-promise"><span><Mail size={17} /></span><div><strong>E-Mail statt Handynummer</strong><small>Deine Adresse ist deine Anmeldung.</small></div></div>
            <div className="auth-promise"><span><ShieldCheck size={18} /></span><div><strong>Bestätigung per E-Mail</strong><small>Ein Link bestätigt dein Konto.</small></div></div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-mode-switch" role="tablist" aria-label="Anmeldemodus">
              <button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''} onClick={() => changeMode('sign-in')}>Anmelden</button>
              <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => changeMode('sign-up')}>Konto erstellen</button>
            </div>
            {pendingPhone ? <form className="modal-form auth-form" onSubmit={verifyPhoneOtp}>
              <div className="auth-pending-phone"><Phone size={18} /><span><strong>SMS-Bestätigung</strong><small>{pendingPhone}</small></span></div>
              <label>Bestätigungscode<input type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-stelliger Code" minLength={6} maxLength={6} required /></label>
              {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-feedback auth-success" role="status">{notice}</p>}
              <button className="primary-button" type="submit" disabled={busy || otp.length !== 6}>{busy ? 'Bitte warten …' : 'Nummer bestätigen'} <ArrowRight size={16} /></button>
              <button className="secondary-button" type="button" onClick={resendPhoneOtp} disabled={busy}>Code erneut senden</button>
            </form> : <>
            <fieldset className="auth-method-switch">
              <legend>{isSignUp ? 'Registrierung über' : 'Anmeldung über'}</legend>
              <label className={authMethod === 'email' ? 'chosen' : ''}><input type="radio" name="auth-method" checked={authMethod === 'email'} onChange={() => changeAuthMethod('email')} /><Mail size={16} /><span>E-Mail</span></label>
              <label className={authMethod === 'phone' ? 'chosen' : ''}><input type="radio" name="auth-method" checked={authMethod === 'phone'} onChange={() => changeAuthMethod('phone')} /><Phone size={16} /><span>Telefonnummer</span></label>
            </fieldset>
            <form className="modal-form auth-form" onSubmit={handleSubmit}>
              {isSignUp && <label>Name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Dein Name" required /></label>}
              {isSignUp && <label>Benutzername<input type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="z.B. max_muster" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required /></label>}
              {authMethod === 'email' && <label>E-Mail-Adresse<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@beispiel.de" required /></label>}
              {(!isSignUp && authMethod === 'phone') && <label>Telefonnummer<input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+49 176 1234567" required /></label>}
              {isSignUp && authMethod === 'phone' && <label>Telefonnummer<input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+49 176 1234567" required /></label>}
              <label>Passwort<input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignUp ? 'Mindestens 8 Zeichen' : 'Dein Passwort'} required /></label>
              {isSignUp && <label>Passwort bestätigen<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Passwort wiederholen" required /></label>}
              {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-feedback auth-success" role="status">{notice}</p>}
              <button className="primary-button" type="submit" disabled={busy || !supabase}>{busy ? 'Bitte warten …' : !supabase ? 'Demnächst verfügbar' : isSignUp ? 'Konto erstellen' : 'Anmelden'} <ArrowRight size={16} /></button>
            </form>
            </>}
            <p className="auth-form-footnote"><ShieldCheck size={13} /> Die Anmeldung wird sicher von Supabase verwaltet.</p>
          </div>
        </div>
        <footer className="auth-footer"><span>KLARTEXT MESSENGER</span><span className="auth-footer-links"><a href="#/demo-auth">Demo mit Anmeldung testen</a><a href="#/demo">Chat testen</a><a href="#/preview">Chat-Oberfläche bearbeiten</a></span></footer>
      </section>
    </main>
  )
}
