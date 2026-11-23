import React from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import App from './App.jsx'
import { AuthScreen } from './Auth.jsx'
import './styles.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const supabase = supabaseUrl && publishableKey
  ? createClient(supabaseUrl, publishableKey)
  : null

function AuthenticatedApp({ client }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) return <div className="auth-loading">Konto wird geladen …</div>
  if (error) return <div className="auth-loading" role="alert">Anmeldung konnte nicht geladen werden: {error}</div>
  return session
    ? <App user={session.user} supabase={client} />
    : <AuthScreen supabase={client} />
}

function Root() {
  return supabase ? <AuthenticatedApp client={supabase} /> : <AuthScreen supabase={null} />
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>)