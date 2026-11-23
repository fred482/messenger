import { useEffect, useState } from 'react'
import { SignIn, SignUp } from '@clerk/react'
import { ArrowRight, Fingerprint, LockKeyhole, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

const appearance = {
  variables: {
    colorPrimary: '#277e66',
    colorText: '#242a28',
    colorBackground: '#ffffff',
    borderRadius: '6px',
    fontFamily: 'DM Sans, sans-serif',
  },
  elements: {
    rootBox: { width: '100%' },
    card: { width: '100%', boxShadow: 'none', border: '1px solid #e9ece8' },
    formButtonPrimary: { backgroundColor: '#277e66' },
  },
}

export function AuthSetup() {
  return (
    <main className="auth-page">
      <section className="auth-layout setup-layout">
        <header className="auth-brand"><span className="brand-mark"><MessageCircle size={19} strokeWidth={2.5} /></span><span className="brand-name">klartext<span>.</span></span></header>
        <div className="setup-content">
          <div className="auth-eyebrow"><LockKeyhole size={14} /> SICHERE ANMELDUNG</div>
          <h1>Anmeldung einrichten</h1>
          <p>Die Verbindung zu Clerk fehlt noch. Lege eine Clerk-Anwendung an und hinterlege den öffentlichen Publishable Key, damit Registrierung und Anmeldung funktionieren.</p>
          <ol className="setup-steps">
            <li><span>1</span><div><strong>Clerk-Anwendung erstellen</strong><small>Eine Anwendung unter clerk.com anlegen.</small></div></li>
            <li><span>2</span><div><strong>E-Mail als Anmeldemethode aktivieren</strong><small>E-Mail-Code für Anmeldung und Bestätigung konfigurieren.</small></div></li>
            <li><span>3</span><div><strong>Schlüssel lokal hinterlegen</strong><small>Den Publishable Key in <code>.env.local</code> eintragen und die App neu starten.</small></div></li>
          </ol>
          <a className="primary-button setup-link" href="https://dashboard.clerk.com/" target="_blank" rel="noreferrer">Clerk-Dashboard öffnen <ArrowRight size={16} /></a>
          <div className="modal-note setup-note"><ShieldCheck size={15} /><span>Nur der öffentliche Publishable Key gehört in die Web-App. Ein Secret Key wird hier nicht benötigt und darf nicht im Browser landen.</span></div>
        </div>
        <div className="setup-footer"><Mail size={14} /> Keine Telefonnummer erforderlich</div>
      </section>
    </main>
  )
}

export function AuthScreen() {
  const [mode, setMode] = useState(() => window.location.hash === '#/sign-up' ? 'sign-up' : 'sign-in')

  useEffect(() => {
    const updateMode = () => setMode(window.location.hash === '#/sign-up' ? 'sign-up' : 'sign-in')
    window.addEventListener('hashchange', updateMode)
    return () => window.removeEventListener('hashchange', updateMode)
  }, [])

  const isSignUp = mode === 'sign-up'

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <header className="auth-brand"><span className="brand-mark"><MessageCircle size={19} strokeWidth={2.5} /></span><span className="brand-name">klartext<span>.</span></span></header>
        <div className="auth-grid">
          <div className="auth-copy">
            <div className="auth-eyebrow"><LockKeyhole size={14} /> PRIVAT VERBUNDEN</div>
            <h1>{isSignUp ? 'Dein Konto. Deine Privatsphäre.' : 'Schön, dass du da bist.'}</h1>
            <p>Mit deiner E-Mail-Adresse anmelden. Eine Telefonnummer brauchst du nicht.</p>
            <div className="auth-promise"><span><Mail size={17} /></span><div><strong>E-Mail statt Handynummer</strong><small>Deine Adresse ist deine Anmeldung.</small></div></div>
            <div className="auth-promise"><span><Fingerprint size={18} /></span><div><strong>Zusätzlicher Geräteschutz</strong><small>Verfügbare Methoden hängen von Konto und Gerät ab.</small></div></div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-mode-switch" role="tablist" aria-label="Anmeldemodus">
              <button role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''} onClick={() => { window.location.hash = '/sign-in'; setMode('sign-in') }}>Anmelden</button>
              <button role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => { window.location.hash = '/sign-up'; setMode('sign-up') }}>Konto erstellen</button>
            </div>
            {isSignUp
              ? <SignUp routing="hash" signInUrl="#/sign-in" fallbackRedirectUrl="/" appearance={appearance} />
              : <SignIn routing="hash" signUpUrl="#/sign-up" fallbackRedirectUrl="/" appearance={appearance} />}
            <p className="auth-form-footnote"><ShieldCheck size={13} /> Anmeldung und E-Mail-Bestätigung laufen sicher über Clerk.</p>
          </div>
        </div>
        <footer className="auth-footer"><span>KLARTEXT MESSENGER</span><span>Ohne Telefonnummer</span></footer>
      </section>
    </main>
  )
}