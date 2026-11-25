import React from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import AdminPanel from './Admin.jsx'
import App from './App.jsx'
import { AuthScreen } from './Auth.jsx'
import { defaultSiteSettings } from './siteSettings.js'
import './styles.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const supabase = supabaseUrl && publishableKey
  ? createClient(supabaseUrl, publishableKey)
  : null
const localSettingsKey = 'klartext-local-preview-settings'

function readLocalSettings() {
  const saved = window.localStorage.getItem(localSettingsKey)
  if (!saved) return null

  const parsed = JSON.parse(saved)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gespeicherte lokale Einstellungen sind ungültig.')
  }
  return { ...defaultSiteSettings, ...parsed }
}

function AuthenticatedApp({ client, siteSettings, settingsError, onSiteSettingsChange, onOpenLocalPreview }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminRoute, setAdminRoute] = useState(() => window.location.hash === '#/admin')
  const [isAdmin, setIsAdmin] = useState(null)
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    let active = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
      setError('')
    })

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError(sessionError.message)
      setSession(data.session)
      setLoading(false)
    }).catch((sessionError) => {
      if (!active) return
      setError(sessionError instanceof Error ? sessionError.message : 'Ein unbekannter Fehler beim Laden des Kontos ist aufgetreten.')
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    const updateRoute = () => setAdminRoute(window.location.hash === '#/admin')
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    if (!session) {
      setIsAdmin(false)
      setAdminError('')
      return
    }

    let active = true
    setIsAdmin(null)
    client.rpc('is_admin').then(({ data, error: roleError }) => {
      if (!active) return
      if (roleError) {
        setAdminError(roleError.message)
        setIsAdmin(false)
      } else {
        setAdminError('')
        setIsAdmin(data === true)
      }
    }).catch((roleError) => {
      if (!active) return
      setAdminError(roleError instanceof Error ? roleError.message : 'Unbekannter Fehler bei der Rechteprüfung.')
      setIsAdmin(false)
    })

    return () => { active = false }
  }, [client, session?.user.id])

  if (loading) return <div className="auth-loading">Konto wird geladen …</div>
  if (error) return <div className="auth-loading" role="alert">Anmeldung konnte nicht geladen werden: {error}</div>
  if (!session) return <AuthScreen supabase={client} siteSettings={siteSettings} />
  if (adminRoute) {
    if (isAdmin === null) return <div className="auth-loading">Admin-Zugriff wird geprüft …</div>
    if (!isAdmin) {
      return (
        <main className="auth-page admin-access-denied">
          <section className="auth-form-panel">
            <h1>Kein Admin-Zugriff</h1>
            <p>Dieser Bereich ist nur für das Admin-Konto freigeschaltet.</p>
            {adminError && <p className="auth-feedback auth-error" role="alert">Admin-Rechte konnten nicht geprüft werden: {adminError}</p>}
            <button className="primary-button" onClick={() => { window.location.hash = '' }}>Zurück zum Messenger</button>
          </section>
        </main>
      )
    }
    return <AdminPanel supabase={client} user={session.user} siteSettings={siteSettings} settingsError={settingsError} onSettingsChange={onSiteSettingsChange} onBack={() => { window.location.hash = '' }} />
  }

  return <App
    user={session.user}
    supabase={client}
    siteSettings={siteSettings}
    isAdmin={isAdmin === true}
    onOpenAdmin={() => { window.location.hash = '/admin' }}
    onOpenLocalPreview={onOpenLocalPreview}
  />
}

function Root() {
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings)
  const [settingsError, setSettingsError] = useState('')
  const [localPreview, setLocalPreview] = useState(() => window.location.hash === '#/preview')
  const [localDemo, setLocalDemo] = useState(() => window.location.hash === '#/demo-chat')
  const [demoAuth, setDemoAuth] = useState(() => window.location.hash === '#/demo' || window.location.hash === '#/demo-auth')
  const [previewSettings, setPreviewSettings] = useState(defaultSiteSettings)
  const [previewError, setPreviewError] = useState('')
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [previewReturn, setPreviewReturn] = useState(null)

  useEffect(() => {
    const updateRoute = () => {
      setLocalPreview(window.location.hash === '#/preview')
      setLocalDemo(window.location.hash === '#/demo-chat')
      setDemoAuth(window.location.hash === '#/demo' || window.location.hash === '#/demo-auth')
    }
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    if (!localPreview) return undefined

    setPreviewLoaded(false)
    try {
      setPreviewSettings(readLocalSettings() ?? siteSettings)
      setPreviewError('')
    } catch (loadError) {
      setPreviewError(loadError instanceof Error ? loadError.message : 'Lokale Vorschau konnte nicht geladen werden.')
    } finally {
      setPreviewLoaded(true)
    }
    return undefined
  }, [localPreview])

  useEffect(() => {
    let active = true
    let localSettings = null
    try {
      localSettings = readLocalSettings()
    } catch (loadError) {
      setSettingsError(loadError instanceof Error ? loadError.message : 'Lokale Einstellungen konnten nicht geladen werden.')
    }

    if (!supabase || localPreview || localDemo) {
      if (localSettings) setSiteSettings(localSettings)
      return () => { active = false }
    }

    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (!active) return
      if (error) {
        setSettingsError(error.message)
        if (localSettings) setSiteSettings(localSettings)
        return
      }
      setSiteSettings({ ...defaultSiteSettings, ...data, ...localSettings })
    }).catch((loadError) => {
      if (!active) return
      setSettingsError(loadError instanceof Error ? loadError.message : 'Unbekannter Fehler beim Laden der Website-Einstellungen.')
      if (localSettings) setSiteSettings(localSettings)
    })

    return () => { active = false }
  }, [localPreview, localDemo])

  useEffect(() => {
    document.title = `${siteSettings.brand_name} · Messenger`
  }, [siteSettings.brand_name])

  if (localPreview) {
    if (!previewLoaded) return <div className="auth-loading">Lokale Vorschau wird geladen …</div>
    return <AdminPanel
      supabase={null}
      user={null}
      siteSettings={previewSettings}
      settingsError={previewError}
      onSettingsChange={(settings) => {
        setPreviewSettings(settings)
        setSiteSettings(settings)
      }}
      onBack={() => {
        window.location.hash = previewReturn ?? '/demo'
        setPreviewReturn(null)
      }}
      localOnly
    />
  }

  if (demoAuth) {
    return <AuthScreen
      supabase={null}
      siteSettings={siteSettings}
      demoMode
      onDemoContinue={() => { window.location.hash = '/demo-chat' }}
    />
  }

  if (localDemo) {
    return <App
      user={{ id: 'local-preview', email: 'Lokale Vorschau', user_metadata: { full_name: 'Deine Vorschau' } }}
      supabase={null}
      siteSettings={siteSettings}
      isAdmin={false}
      onOpenLocalPreview={() => {
        setPreviewReturn('/demo')
        window.location.hash = '/preview'
      }}
      demoMode
    />
  }

  return supabase
    ? <AuthenticatedApp
      client={supabase}
      siteSettings={siteSettings}
      settingsError={settingsError}
      onSiteSettingsChange={setSiteSettings}
      onOpenLocalPreview={() => {
        setPreviewReturn('')
        window.location.hash = '/preview'
      }}
    />
    : <AuthScreen supabase={null} siteSettings={siteSettings} />
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>)