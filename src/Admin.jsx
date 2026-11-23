import { useEffect, useState } from 'react'
import { ArrowLeft, ContactRound, Eye, Palette, Save, Users } from 'lucide-react'

const sections = [
  { id: 'design', label: 'Design & Texte', icon: Palette },
  { id: 'users', label: 'Nutzer', icon: Users },
  { id: 'contacts', label: 'Kontakte', icon: ContactRound },
]

export default function AdminPanel({ supabase, user, siteSettings, settingsError, onSettingsChange, onBack }) {
  const [section, setSection] = useState('design')
  const [draft, setDraft] = useState(siteSettings)
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [dataError, setDataError] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(siteSettings)
  }, [siteSettings])

  useEffect(() => {
    let active = true

    async function loadAdminData() {
      try {
        const [usersResult, contactsResult] = await Promise.all([
          supabase.from('profiles').select('id, username, display_name, created_at').order('username'),
          supabase.from('contacts').select('user_id, contact_id, created_at').order('created_at', { ascending: false }),
        ])

        if (!active) return
        if (usersResult.error || contactsResult.error) {
          setDataError(usersResult.error?.message || contactsResult.error?.message || 'Admin-Daten konnten nicht geladen werden.')
          return
        }

        setUsers(usersResult.data ?? [])
        setContacts(contactsResult.data ?? [])
      } catch (loadError) {
        if (active) {
          setDataError(loadError instanceof Error ? loadError.message : 'Unbekannter Fehler beim Laden der Admin-Daten.')
        }
      } finally {
        if (active) setLoadingData(false)
      }
    }

    loadAdminData()
    return () => { active = false }
  }, [supabase])

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
    setSaveError('')
  }

  async function saveSettings(event) {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaved(false)

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .update({
          brand_name: draft.brand_name.trim(),
          logo_text: draft.logo_text.trim(),
          auth_heading: draft.auth_heading.trim(),
          auth_description: draft.auth_description.trim(),
          accent_color: draft.accent_color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
        .select()
        .single()

      if (error) {
        setSaveError(error.message)
        return
      }

      onSettingsChange(data)
      setDraft(data)
      setSaved(true)
    } catch (saveError) {
      setSaveError(saveError instanceof Error ? saveError.message : 'Unbekannter Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const profileById = new Map(users.map((profile) => [profile.id, profile]))

  return (
    <main className="admin-page" style={{ '--green': draft.accent_color }}>
      <header className="admin-header">
        <button className="admin-back" onClick={onBack}><ArrowLeft size={17} /> Zurück zum Messenger</button>
        <div>
          <span className="admin-eyebrow">ADMIN-BEREICH</span>
          <h1>Website bearbeiten</h1>
          <p>Angemeldet als {user.email}. Nur dein Admin-Konto kann Änderungen speichern.</p>
        </div>
      </header>

      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Admin-Bereiche">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}>
              <Icon size={17} /> {label}
              {id === 'users' && <span>{users.length}</span>}
              {id === 'contacts' && <span>{contacts.length}</span>}
            </button>
          ))}
        </nav>

        <section className="admin-content">
          {section === 'design' && <div className="admin-design-grid">
            <form className="admin-editor" onSubmit={saveSettings}>
              <div className="admin-section-heading"><h2>Darstellung</h2><p>Die Vorschau aktualisiert sich beim Bearbeiten.</p></div>
              {settingsError && <p className="auth-feedback auth-error" role="alert">Einstellungen konnten nicht geladen werden: {settingsError}</p>}
              <label>Seitenname<input value={draft.brand_name} maxLength={32} onChange={(event) => updateDraft('brand_name', event.target.value)} required /></label>
              <label>Logo-Zeichen<input value={draft.logo_text} maxLength={4} onChange={(event) => updateDraft('logo_text', event.target.value)} required /></label>
              <label>Überschrift<input value={draft.auth_heading} maxLength={80} onChange={(event) => updateDraft('auth_heading', event.target.value)} required /></label>
              <label>Beschreibung<textarea value={draft.auth_description} maxLength={240} rows={3} onChange={(event) => updateDraft('auth_description', event.target.value)} required /></label>
              <label className="admin-color-field">Akzentfarbe<input type="color" value={draft.accent_color} onChange={(event) => updateDraft('accent_color', event.target.value)} /></label>
              {saveError && <p className="auth-feedback auth-error" role="alert">Änderungen konnten nicht gespeichert werden: {saveError}</p>}
              {saved && <p className="auth-feedback auth-success" role="status">Änderungen gespeichert.</p>}
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Speichere …' : 'Änderungen speichern'} <Save size={16} /></button>
            </form>

            <div className="admin-preview-column">
              <div className="admin-section-heading"><h2><Eye size={16} /> Live-Vorschau</h2><p>So sehen Besucher die Anmeldung.</p></div>
              <div className="admin-preview">
                <header className="auth-brand">
                  <span className="brand-mark">{draft.logo_text}</span>
                  <span className="brand-name">{draft.brand_name}<span>.</span></span>
                </header>
                <div className="admin-preview-content">
                  <h3>{draft.auth_heading}</h3>
                  <p>{draft.auth_description}</p>
                  <div className="admin-preview-input">E-Mail-Adresse</div>
                  <button className="primary-button" disabled>Konto erstellen</button>
                </div>
              </div>
            </div>
          </div>}

          {section === 'users' && <div className="admin-table-section">
            <div className="admin-section-heading"><h2>Nutzerkonten</h2><p>Nur Namen und Benutzernamen. Konten können hier nicht geändert oder gelöscht werden.</p></div>
            {dataError && <p className="auth-feedback auth-error" role="alert">{dataError}</p>}
            {loadingData ? <p className="admin-empty">Lade Nutzer …</p> : users.length === 0 ? <p className="admin-empty">Noch keine bestätigten Nutzerkonten.</p> : <div className="admin-table-wrap">
              <table className="admin-table"><thead><tr><th>Name</th><th>Benutzername</th><th>Erstellt</th></tr></thead><tbody>
                {users.map((profile) => <tr key={profile.id}><td>{profile.display_name}</td><td>@{profile.username}</td><td>{new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(profile.created_at))}</td></tr>)}
              </tbody></table>
            </div>}
          </div>}

          {section === 'contacts' && <div className="admin-table-section">
            <div className="admin-section-heading"><h2>Kontakte</h2><p>Übersicht gespeicherter Kontaktverbindungen. Diese Ansicht ist nur lesbar.</p></div>
            {dataError && <p className="auth-feedback auth-error" role="alert">{dataError}</p>}
            {loadingData ? <p className="admin-empty">Lade Kontakte …</p> : contacts.length === 0 ? <p className="admin-empty">Noch keine Kontakte gespeichert.</p> : <div className="admin-table-wrap">
              <table className="admin-table"><thead><tr><th>Von</th><th>Kontakt</th><th>Hinzugefügt</th></tr></thead><tbody>
                {contacts.map((contact) => {
                  const owner = profileById.get(contact.user_id)
                  const target = profileById.get(contact.contact_id)
                  return <tr key={`${contact.user_id}-${contact.contact_id}`}><td>{owner ? `@${owner.username}` : 'Nutzerkonto'}</td><td>{target ? `@${target.username}` : 'Nutzerkonto'}</td><td>{new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(contact.created_at))}</td></tr>
                })}
              </tbody></table>
            </div>}
          </div>}
        </section>
      </div>
    </main>
  )
}
