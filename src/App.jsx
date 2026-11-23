import { useMemo, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  UserRound,
  X,
} from 'lucide-react'

const initialChats = [
  {
    id: 'lena',
    name: 'Lena Hoffmann',
    email: 'lena.hoffmann@posteo.de',
    initials: 'LH',
    color: 'coral',
    online: true,
    time: '10:42',
    unread: 2,
    preview: 'Das klingt nach einem Plan. Bis später! ✨',
    messages: [
      { id: 1, from: 'them', text: 'Hey! Wie war dein Wochenende am Meer?', time: '10:34' },
      { id: 2, from: 'me', text: 'Richtig schön. Ich hab endlich mal wieder durchgeatmet.', time: '10:36', read: true },
      { id: 3, from: 'them', text: 'Das freut mich total für dich ☀️', time: '10:38' },
      { id: 4, from: 'me', text: 'Wir sollten auch mal zusammen los. Hast du nächste Woche Zeit?', time: '10:40', read: true },
      { id: 5, from: 'them', text: 'Das klingt nach einem Plan. Bis später! ✨', time: '10:42' },
    ],
  },
  {
    id: 'jonas',
    name: 'Jonas Richter',
    email: 'jonas.richter@mailbox.org',
    initials: 'JR',
    color: 'blue',
    online: false,
    time: 'Gestern',
    unread: 0,
    preview: 'Die Fotos sind jetzt im geteilten Album.',
    messages: [
      { id: 1, from: 'them', text: 'Die Fotos sind jetzt im geteilten Album.', time: '18:22' },
    ],
  },
  {
    id: 'amira',
    name: 'Amira Yilmaz',
    email: 'amira.yilmaz@posteo.de',
    initials: 'AY',
    color: 'green',
    online: true,
    time: 'Di.',
    unread: 0,
    preview: 'Danke fürs Rezept, das probiere ich aus!',
    messages: [
      { id: 1, from: 'them', text: 'Danke fürs Rezept, das probiere ich aus!', time: '16:08' },
    ],
  },
  {
    id: 'team',
    name: 'Wochenendrunde',
    email: '3 Mitglieder',
    initials: 'WR',
    color: 'yellow',
    online: false,
    time: 'Mo.',
    unread: 0,
    preview: 'Mara: Ich bringe Kaffee mit ☕',
    messages: [
      { id: 1, from: 'them', text: 'Mara: Ich bringe Kaffee mit ☕', time: '09:15' },
    ],
  },
]

function Avatar({ chat, size = 'normal' }) {
  return (
    <div className={`avatar avatar-${chat.color} avatar-${size}`} aria-hidden="true">
      {chat.initials}
      {chat.online && <span className="online-dot" />}
    </div>
  )
}

function App({ user, supabase }) {
  const [chats, setChats] = useState(initialChats)
  const [activeId, setActiveId] = useState('lena')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(() => window.matchMedia('(min-width: 1081px)').matches)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const messageEnd = useRef(null)

  const accountEmail = user?.email ?? ''
  const accountName = user?.user_metadata?.full_name || accountEmail || 'Dein Konto'
  const accountInitial = accountName.charAt(0).toUpperCase()
  const activeChat = chats.find((chat) => chat.id === activeId) ?? chats[0]
  const visibleChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return chats
    return chats.filter((chat) => `${chat.name} ${chat.email} ${chat.preview}`.toLowerCase().includes(query))
  }, [chats, search])

  function showNotice(text) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3200)
  }

  async function signOutAccount() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) showNotice(`Abmelden nicht möglich: ${error.message}`)
    } catch (signOutError) {
      showNotice(`Abmelden nicht möglich: ${signOutError instanceof Error ? signOutError.message : 'Unbekannter Fehler.'}`)
    }
  }

  function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text || !activeChat) return
    const sentAt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date())
    setChats((current) => current.map((chat) => chat.id === activeId
      ? { ...chat, time: sentAt, preview: text, messages: [...chat.messages, { id: Date.now(), from: 'me', text, time: sentAt, read: false }] }
      : chat))
    setMessage('')
    window.setTimeout(() => messageEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 40)
  }

  function addContact(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const name = String(form.get('name') ?? '').trim()
    if (!email || !name) return
    if (chats.some((chat) => chat.email === email)) {
      showNotice('Dieser Kontakt ist bereits in deiner Liste.')
      return
    }
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    const chat = { id: crypto.randomUUID(), name, email, initials, color: 'blue', online: false, time: 'Neu', unread: 0, preview: 'Noch keine Nachrichten', messages: [] }
    setChats((current) => [chat, ...current])
    setActiveId(chat.id)
    setDialog(null)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark"><MessageCircle size={19} strokeWidth={2.5} /></div>
          <span className="brand-name">klartext<span>.</span></span>
          <button className="icon-button sidebar-more" aria-label="Menü öffnen" onClick={() => setDialog('settings')}><MoreHorizontal size={20} /></button>
        </div>

        <div className="account-chip">
          <div className="account-avatar">{accountInitial}</div>
          <div className="account-copy"><strong>{accountName}</strong><span>{accountEmail}</span></div>
          <ChevronDown size={16} className="muted-icon" />
        </div>

        <div className="section-label-row">
          <span className="section-label">NACHRICHTEN</span>
          <button className="icon-button new-chat" aria-label="Neuen Chat starten" title="Neuen Chat starten" onClick={() => setDialog('contact')}><Plus size={18} /></button>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Suchen" aria-label="Chats durchsuchen" />
          <kbd>⌘ K</kbd>
        </label>

        <div className="chat-list">
          {visibleChats.map((chat) => (
            <button key={chat.id} className={`chat-row ${activeId === chat.id ? 'active' : ''}`} onClick={() => setActiveId(chat.id)}>
              <Avatar chat={chat} />
              <span className="chat-row-copy">
                <span className="chat-row-title"><strong>{chat.name}</strong><time>{chat.time}</time></span>
                <span className="chat-row-preview">{chat.preview}</span>
              </span>
              {chat.unread > 0 && <span className="unread-count">{chat.unread}</span>}
            </button>
          ))}
          {visibleChats.length === 0 && <p className="empty-search">Keine Chats gefunden.</p>}
        </div>

        <div className="sidebar-bottom">
          <div className="privacy-mini"><ShieldCheck size={17} /><span><strong>Privatsphäre zuerst</strong><small>Dein Konto ohne Telefonnummer</small></span><Check size={15} /></div>
          <button className="sidebar-action" onClick={() => setDialog('settings')}><Settings2 size={17} /> Einstellungen <span>⌘ ,</span></button>
          <button className="sidebar-action" onClick={() => showNotice('Hilfe ist in diesem Prototyp noch nicht verfügbar.')}><CircleHelp size={17} /> Hilfe & Feedback</button>
        </div>
      </aside>

      <section className="conversation" aria-label={`Chat mit ${activeChat?.name}`}>
        <header className="conversation-header">
          <button className="icon-button back-button" aria-label="Zurück zu Chats" onClick={() => setDetailsOpen(false)}><ArrowLeft size={19} /></button>
          {activeChat && <Avatar chat={activeChat} size="small" />}
          <div className="conversation-person"><strong>{activeChat?.name}</strong><span>{activeChat?.online ? 'Gerade online' : activeChat?.email}</span></div>
          <div className="header-actions">
            <div className="encryption-pill"><LockKeyhole size={13} /><span>Demo-Modus</span></div>
            <button className={`icon-button details-toggle ${detailsOpen ? 'selected' : ''}`} aria-label="Sicherheitsdetails anzeigen" title="Sicherheitsdetails" onClick={() => setDetailsOpen((open) => !open)}><SlidersHorizontal size={18} /></button>
            <button className="icon-button" aria-label="Weitere Chatoptionen" onClick={() => showNotice('Weitere Chatoptionen folgen im nächsten Entwicklungsschritt.')}><MoreHorizontal size={20} /></button>
          </div>
        </header>

        <div className="demo-banner"><LockKeyhole size={15} /><span><strong>Lokaler Prototyp.</strong> Nachrichten werden nicht zugestellt und sind noch nicht Ende-zu-Ende-verschlüsselt.</span><button aria-label="Hinweis schließen" onClick={(event) => event.currentTarget.parentElement.remove()}><X size={15} /></button></div>

        <div className="message-scroll">
          <div className="day-divider"><span>HEUTE</span></div>
          <div className="secure-note"><div className="secure-note-icon"><LockKeyhole size={15} /></div><p>Nachrichten in einem echten Klartext-Chat sind nur für euch beide lesbar.<br /><span>In diesem Prototyp ist die Verschlüsselung noch nicht aktiv.</span></p></div>
          <div className="messages">
            {activeChat?.messages.map((item) => (
              <div key={item.id} className={`message-line ${item.from === 'me' ? 'mine' : ''}`}>
                {item.from === 'them' && <Avatar chat={activeChat} size="tiny" />}
                <div className="message-content"><div className="bubble">{item.text}</div><div className="message-meta"><time>{item.time}</time>{item.from === 'me' && (item.read ? <CheckCheck size={14} /> : <Check size={14} />)}</div></div>
              </div>
            ))}
            <div ref={messageEnd} />
          </div>
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <button type="button" className="icon-button composer-tool" title="Anhang (Demo)" aria-label="Anhang hinzufügen" onClick={() => showNotice('Anhänge sind im Prototyp noch nicht verfügbar.')}><Paperclip size={19} /></button>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nachricht schreiben …" aria-label="Nachricht schreiben" />
          <button type="button" className="icon-button composer-tool emoji-button" title="Emoji (Demo)" aria-label="Emoji auswählen" onClick={() => setMessage((current) => `${current} ☀️`)}><Smile size={19} /></button>
          <button type="submit" className="send-button" aria-label="Nachricht senden" disabled={!message.trim()}><Send size={17} /></button>
        </form>
        <div className="composer-footnote"><LockKeyhole size={11} /> Lokal in dieser Vorschau</div>
      </section>

      {detailsOpen && <aside className="details-panel">
        <div className="details-top"><span>CHAT-DETAILS</span><button className="icon-button" aria-label="Details schließen" onClick={() => setDetailsOpen(false)}><X size={17} /></button></div>
        {activeChat && <>
          <div className="contact-profile"><Avatar chat={activeChat} size="large" /><h2>{activeChat.name}</h2><p>{activeChat.email}</p><span className={`contact-presence ${activeChat.online ? 'is-online' : ''}`}><i />{activeChat.online ? 'Online' : 'Zuletzt gesehen: gestern'}</span></div>
          <div className="detail-rule" />
          <div className="security-heading"><span className="security-icon"><ShieldCheck size={18} /></span><div><strong>Sicherheit</strong><small>Für echte Chats geplant</small></div></div>
          <div className="security-row"><span>Ende-zu-Ende-Verschlüsselung</span><span className="status-planned">Nicht aktiv</span></div>
          <div className="security-row"><span>Identität verifizieren</span><button className="text-action" onClick={() => showNotice('Die Schlüsselverifizierung wird mit der E2E-Integration verfügbar.')}>Ansehen <ArrowDownLeft size={13} /></button></div>
          <div className="detail-rule lower-rule" />
          <button className="detail-action" onClick={() => showNotice('Benachrichtigungen verwaltest du in den Geräteeinstellungen.')}><Bell size={17} /> Benachrichtigungen</button>
          <button className="detail-action danger-action" onClick={() => showNotice('Kontakt blockieren wird noch nicht unterstützt.')}><UserRound size={17} /> Kontakt blockieren</button>
          <div className="detail-footnote"><LockKeyhole size={14} /><p>Kein Telefonbuch-Upload.<br />Kontakte per E-Mail hinzufügen.</p></div>
        </>}
      </aside>}

      {notice && <div className="toast" role="status">{notice}</div>}

      {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="icon-button modal-close" aria-label="Schließen" onClick={() => setDialog(null)}><X size={18} /></button>
          {dialog === 'contact' ? <>
            <div className="modal-icon"><Plus size={20} /></div>
            <h2 id="modal-title">Neuen Chat starten</h2>
            <p className="modal-description">Füge jemanden über die E-Mail-Adresse hinzu. Eine Telefonnummer ist nicht nötig.</p>
            <form className="modal-form" onSubmit={addContact}>
              <label>Name<input name="name" placeholder="Vor- und Nachname" required autoFocus /></label>
              <label>E-Mail-Adresse<input name="email" type="email" placeholder="name@beispiel.de" required /></label>
              <button className="primary-button" type="submit">Kontakt hinzufügen <ArrowDownLeft size={16} /></button>
            </form>
          </> : <>
            <div className="modal-icon"><Settings2 size={20} /></div>
            <h2 id="modal-title">Konto & Sicherheit</h2>
            <p className="modal-description">Dein Konto nutzt E-Mail und Passwort. Für die Anmeldung ist keine 2FA erforderlich.</p>
            <div className="signed-in-email"><span>E-Mail-Adresse</span><strong>{accountEmail}</strong></div>
            <div className="modal-note"><ShieldCheck size={15} /><span>{user.email_confirmed_at ? 'Deine E-Mail-Adresse wurde bestätigt.' : 'Bestätige deine E-Mail-Adresse für mehr Kontosicherheit.'} Die Anmeldung wird von Supabase verwaltet.</span></div>
            <button className="logout-button" onClick={signOutAccount}><LogOut size={15} /> Abmelden</button>
          </>}
        </section>
      </div>}
    </main>
  )
}

export default App