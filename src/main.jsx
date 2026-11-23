import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkLoaded, ClerkLoading, ClerkProvider, useUser } from '@clerk/react'
import App from './App.jsx'
import { AuthScreen, AuthSetup } from './Auth.jsx'
import './styles.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()

function AuthenticatedApp() {
  const { user } = useUser()
  return user ? <App /> : <AuthScreen />
}

function Root() {
  if (!publishableKey) return <AuthSetup />

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkLoading><div className="auth-loading">Konto wird geladen …</div></ClerkLoading>
      <ClerkLoaded><AuthenticatedApp /></ClerkLoaded>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>)