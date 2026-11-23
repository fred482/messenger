import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Heart,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Palette,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Send,
  Settings,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  UserRound,
  X,
} from 'lucide-react'

const appSections = [
  { id: 'messages', label: 'Nachrichten', icon: MessageCircle },
  { id: 'calls', label: 'Anrufe', icon: Phone },
  { id: 'status', label: 'Status', icon: Camera },
  { id: 'momento', label: 'Momento', icon: ImagePlus },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
]

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

function contactToChat(profile) {
  const name = profile.display_name || profile.username
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return {
    id: profile.id,
    username: profile.username,
    name,
    email: `@${profile.username}`,
    initials,
    color: 'blue',
    online: false,
    time: 'Neu',
    unread: 0,
    preview: 'Noch keine Nachrichten',
    messages: [],
    savedContact: true,
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Das Bild konnte nicht gelesen werden.'))
    }
    reader.onerror = () => reject(reader.error || new Error('Das Bild konnte nicht gelesen werden.'))
    reader.readAsDataURL(file)
  })
}

function App({ user, supabase, siteSettings, isAdmin, onOpenAdmin, onOpenLocalPreview, demoMode = false }) {
  const [chats, setChats] = useState(initialChats)
  const [activeId, setActiveId] = useState('lena')
  const [activeSection, setActiveSection] = useState('messages')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(() => window.matchMedia('(min-width: 1081px)').matches)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const [contactUsername, setContactUsername] = useState('')
  const [contactResult, setContactResult] = useState(null)
  const [contactError, setContactError] = useState('')
  const [contactBusy, setContactBusy] = useState(false)
  const [statusImages, setStatusImages] = useState([])
  const [momentoPosts, setMomentoPosts] = useState([])
  const [momentImage, setMomentImage] = useState('')
  const [momentCaption, setMomentCaption] = useState('')
  const messageEnd = useRef(null)

  const accountEmail = user?.email ?? ''
  const accountUsername = user?.user_metadata?.username
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

  useEffect(() => {
    if (demoMode || !supabase) return undefined

    let active = true

    async function loadContacts() {
      try {
        const { data, error } = await supabase.rpc('list_my_contacts')
        if (error) {
          if (active) showNotice(`Kontakte konnten nicht geladen werden: ${error.message}`)
          return
        }
        if (!active) return
        setChats((current) => [...(data ?? []).map(contactToChat), ...current.filter((chat) => !chat.savedContact)])
      } catch (loadError) {
        if (active) {
          showNotice(`Kontakte konnten nicht geladen werden: ${loadError instanceof Error ? loadError.message : 'Unbekannter Fehler.'}`)
        }
      }
    }

    loadContacts()
    return () => { active = false }
  }, [demoMode, supabase, user.id])

  async function signOutAccount() {
    if (demoMode) {
      showNotice('In der lokalen Vorschau gibt es kein angemeldetes Konto.')
      return
    }

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

  async function getLocalImage(file) {
    if (!file.type.startsWith('image/')) throw new Error('Bitte wähle eine Bilddatei aus.')
    if (file.size > 4 * 1024 * 1024) throw new Error('Das Bild darf höchstens 4 MB groß sein.')
    return readImageFile(file)
  }

  async function addStatusImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const image = await getLocalImage(file)
      setStatusImages((current) => [{ id: Date.now(), image }, ...current])
    } catch (uploadError) {
      showNotice(`Bild konnte nicht hinzugefügt werden: ${uploadError instanceof Error ? uploadError.message : 'Unbekannter Fehler.'}`)
    }
  }

  async function selectMomentImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      setMomentImage(await getLocalImage(file))
    } catch (uploadError) {
      showNotice(`Bild konnte nicht geladen werden: ${uploadError instanceof Error ? uploadError.message : 'Unbekannter Fehler.'}`)
    }
  }

  function publishMoment(event) {
    event.preventDefault()
    if (!momentImage) {
      showNotice('Wähle zuerst ein Bild für deinen Momento-Beitrag aus.')
      return
    }
    setMomentoPosts((current) => [{
      id: Date.now(),
      image: momentImage,
      caption: momentCaption.trim(),
      likes: 0,
      liked: false,
    }, ...current])
    setMomentImage('')
    setMomentCaption('')
  }

  function toggleMomentLike(postId) {
    setMomentoPosts((current) => current.map((post) => post.id === postId
      ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
      : post))
  }

  function openContactDialog() {
    setContactUsername('')
    setContactResult(null)
    setContactError('')
    setDialog('contact')
  }

  async function findContact(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim().replace(/^@/, '').toLowerCase()
    setContactUsername(username)
    setContactResult(null)
    setContactError('')

    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      setContactError('Benutzernamen müssen 3–24 Zeichen lang sein und dürfen nur Buchstaben, Zahlen und _ enthalten.')
      return
    }

    setContactBusy(true)
    try {
      const { data, error } = await supabase.rpc('find_profile_by_username', { search_username: username })
      if (error) {
        setContactError(error.message)
        return
      }

      const profile = data?.[0]
      if (!profile) {
        setContactError('Kein Konto mit diesem Benutzernamen gefunden.')
        return
      }
      if (chats.some((chat) => chat.id === profile.id)) {
        setContactError('Dieser Kontakt ist bereits in deiner Liste.')
        return
      }
      setContactResult(profile)
    } catch (searchError) {
      setContactError(searchError instanceof Error ? searchError.message : 'Unbekannter Fehler bei der Suche.')
    } finally {
      setContactBusy(false)
    }
  }

  async function addContact() {
    if (!contactResult) return
    setContactBusy(true)
    setContactError('')
    try {
      const { error } = await supabase.from('contacts').insert({ contact_id: contactResult.id })
      if (error) {
        setContactError(error.code === '23505'
          ? 'Dieser Kontakt ist bereits in deiner Liste.'
          : error.message)
        return
      }

      const chat = contactToChat(contactResult)
      setChats((current) => [chat, ...current.filter((existing) => existing.id !== chat.id)])
      setActiveId(chat.id)
      setDialog(null)
    } catch (saveError) {
      setContactError(saveError instanceof Error ? saveError.message : 'Unbekannter Fehler beim Speichern.')
    } finally {
      setContactBusy(false)
    }
  }

  return (
    <main className="app-shell" style={{ '--green': siteSettings.accent_color }}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">{siteSettings.logo_text || <MessageCircle size={19} strokeWidth={2.5} />}</div>
          <span className="brand-name">{siteSettings.brand_name}<span>.</span></span>
          <button className="icon-button sidebar-more" aria-label="Menü öffnen" onClick={() => demoMode ? setActiveSection('settings') : setDialog('settings')}><MoreHorizontal size={20} /></button>
        </div>

        <div className="account-chip">
          <div className="account-avatar">{accountInitial}</div>
          <div className="account-copy"><strong>{accountName}</strong><span>{accountUsername ? `@${accountUsername}` : accountEmail}</span></div>
          <ChevronDown size={16} className="muted-icon" />
        </div>

        <div className="section-label-row">
          <span className="section-label">NACHRICHTEN</span>
          <button className="icon-button new-chat" aria-label="Neuen Chat starten" title={demoMode ? 'Nur mit Anmeldung verfügbar' : 'Neuen Chat starten'} onClick={openContactDialog} disabled={demoMode}><Plus size={18} /></button>
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
          <button className="sidebar-action" onClick={() => setActiveSection('settings')}><Settings2 size={17} /> Einstellungen <span>⌘ ,</span></button>
          {isAdmin && <button className="sidebar-action" onClick={onOpenAdmin}><Settings2 size={17} /> Chat-Oberfläche bearbeiten</button>}
          <button className="sidebar-action" title="Änderungen bleiben nur in diesem Browser" onClick={onOpenLocalPreview}><Palette size={17} /> Chat bearbeiten</button>
          <button className="sidebar-action" onClick={() => showNotice('Hilfe ist in diesem Prototyp noch nicht verfügbar.')}><CircleHelp size={17} /> Hilfe & Feedback</button>
        </div>
      </aside>

      {activeSection === 'messages' ? <section className="conversation" aria-label={`Chat mit ${activeChat?.name}`}>
        <header className="conversation-header">
          <button className="icon-button back-button" aria-label="Zurück zu Chats" onClick={() => setDetailsOpen(false)}><ArrowLeft size={19} /></button>
          {activeChat && <Avatar chat={activeChat} size="small" />}
          <div className="conversation-person"><strong>{activeChat?.name}</strong><span>{activeChat?.online ? 'Gerade online' : activeChat?.username ? `@${activeChat.username}` : activeChat?.email}</span></div>
          <div className="header-actions">
            <div className="encryption-pill"><LockKeyhole size={13} /><span>Demo-Modus</span></div>
            <button className={`icon-button details-toggle ${detailsOpen ? 'selected' : ''}`} aria-label="Sicherheitsdetails anzeigen" title="Sicherheitsdetails" onClick={() => setDetailsOpen((open) => !open)}><SlidersHorizontal size={18} /></button>
            <button className="icon-button" aria-label="Weitere Chatoptionen" onClick={() => showNotice('Weitere Chatoptionen folgen im nächsten Entwicklungsschritt.')}><MoreHorizontal size={20} /></button>
          </div>
        </header>

        <div className="demo-banner"><LockKeyhole size={15} /><span><strong>Lokaler Prototyp.</strong> {siteSettings.chat_banner}</span><button aria-label="Hinweis schließen" onClick={(event) => event.currentTarget.parentElement.remove()}><X size={15} /></button></div>

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
        <div className="composer-footnote"><LockKeyhole size={11} /> {demoMode ? 'Nur lokale Vorschau' : 'Lokaler Prototyp'}</div>
      </section> : <section className="activity-page">
        {activeSection === 'calls' && <>
          <header className="activity-heading"><div><span className="activity-eyebrow">VERBUNDEN BLEIBEN</span><h1>Anrufe</h1><p>Anrufliste als Vorschau. Echte Anrufe sind noch nicht verfügbar.</p></div></header>
          <div className="call-list">
            {chats.slice(0, 3).map((chat, index) => (
              <article className="call-row" key={chat.id}>
                <Avatar chat={chat} />
                <div className="call-copy"><strong>{chat.name}</strong><span>{index === 0 ? 'Eingehender Audioanruf · Heute, 10:42' : index === 1 ? 'Videoanruf · Gestern' : 'Ausgehender Anruf · Montag'}</span></div>
                <button className="icon-button call-action" aria-label={`Anruf bei ${chat.name}`} onClick={() => showNotice('Anrufe sind in diesem lokalen Prototyp noch nicht echt.')}><PhoneCall size={18} /></button>
              </article>
            ))}
          </div>
        </>}

        {activeSection === 'status' && <>
          <header className="activity-heading"><div><span className="activity-eyebrow">LOKALER STATUS</span><h1>Status</h1><p>Teile ein Bild als lokalen Status. Es wird nicht hochgeladen oder mit anderen geteilt.</p></div></header>
          <label className="status-upload-card">
            <span className="status-upload-icon"><ImagePlus size={23} /></span>
            <strong>Bild zum Status hinzufügen</strong>
            <small>JPG, PNG oder ein anderes Bild · maximal 4 MB</small>
            <input type="file" accept="image/*" onChange={addStatusImage} />
          </label>
          {statusImages.length > 0 ? <div className="status-grid">
            {statusImages.map((status) => <article className="status-card" key={status.id}><img src={status.image} alt="Dein lokaler Status" /><span>Dein Status · gerade eben</span></article>)}
          </div> : <div className="activity-empty"><Camera size={27} /><strong>Noch kein Status</strong><span>Wähle ein Bild aus, um es hier lokal anzusehen.</span></div>}
        </>}

        {activeSection === 'momento' && <>
          <header className="activity-heading momento-heading"><div><span className="activity-eyebrow">DEINE BILDER. DEINE MOMENTE.</span><h1>Momento</h1><p>Ein lokaler Foto-Feed — Beiträge sind nur in dieser Sitzung sichtbar.</p></div></header>
          <form className="momento-composer" onSubmit={publishMoment}>
            <label className="momento-image-picker">
              {momentImage ? <img src={momentImage} alt="Ausgewählter Momento-Beitrag" /> : <><ImagePlus size={25} /><span>Bild auswählen</span></>}
              <input type="file" accept="image/*" onChange={selectMomentImage} />
            </label>
            <div className="momento-compose-fields"><textarea value={momentCaption} onChange={(event) => setMomentCaption(event.target.value)} maxLength={240} placeholder="Was möchtest du teilen?" aria-label="Bildbeschreibung" /><button className="primary-button" type="submit" disabled={!momentImage}>In Momento teilen <Send size={15} /></button></div>
          </form>
          {momentoPosts.length > 0 ? <div className="momento-feed">
            {momentoPosts.map((post) => <article className="momento-post" key={post.id}>
              <header><div className="account-avatar">{accountInitial}</div><strong>{accountName}</strong><span>gerade eben</span></header>
              <img src={post.image} alt={post.caption || 'Lokaler Momento-Beitrag'} />
              <div className="momento-post-actions"><button className={post.liked ? 'liked' : ''} onClick={() => toggleMomentLike(post.id)} aria-label={post.liked ? 'Gefällt mir entfernen' : 'Gefällt mir'}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} /></button><span>{post.likes} gefällt das</span></div>
              {post.caption && <p><strong>{accountName}</strong> {post.caption}</p>}
            </article>)}
          </div> : <div className="activity-empty"><ImagePlus size={27} /><strong>Dein Momento-Feed</strong><span>Wähle oben ein Bild aus und teile deinen ersten Moment.</span></div>}
        </>}

        {activeSection === 'settings' && <>
          <header className="activity-heading"><div><span className="activity-eyebrow">DEIN KONTO</span><h1>Einstellungen</h1><p>Verwalte dein Konto und die lokale Vorschau.</p></div></header>
          <section className="settings-card">
            <div className="settings-profile"><div className="account-avatar">{accountInitial}</div><div><strong>{accountName}</strong><span>{accountUsername ? `@${accountUsername}` : accountEmail}</span></div></div>
            <div className="local-prototype-note"><LockKeyhole size={16} /><span>Status- und Momento-Bilder sind nur in dieser Sitzung sichtbar und werden weder gespeichert noch geteilt. Nachrichten und Anrufe sind Demo-Funktionen.</span></div>
            <button className="primary-button" onClick={onOpenLocalPreview}><Palette size={16} /> Chat-Oberfläche bearbeiten</button>
            {isAdmin && <button className="secondary-button" onClick={onOpenAdmin}><Settings2 size={16} /> Chat bearbeiten (Admin)</button>}
            {!demoMode && <button className="logout-button" onClick={signOutAccount}><LogOut size={15} /> Abmelden</button>}
          </section>
        </>}
      </section>}

      {activeSection === 'messages' && detailsOpen && <aside className="details-panel">
        <div className="details-top"><span>CHAT-DETAILS</span><button className="icon-button" aria-label="Details schließen" onClick={() => setDetailsOpen(false)}><X size={17} /></button></div>
        {activeChat && <>
          <div className="contact-profile"><Avatar chat={activeChat} size="large" /><h2>{activeChat.name}</h2><p>{activeChat.username ? `@${activeChat.username}` : activeChat.email}</p><span className={`contact-presence ${activeChat.online ? 'is-online' : ''}`}><i />{activeChat.online ? 'Online' : 'Zuletzt gesehen: gestern'}</span></div>
          <div className="detail-rule" />
          <div className="security-heading"><span className="security-icon"><ShieldCheck size={18} /></span><div><strong>Sicherheit</strong><small>Für echte Chats geplant</small></div></div>
          <div className="security-row"><span>Ende-zu-Ende-Verschlüsselung</span><span className="status-planned">Nicht aktiv</span></div>
          <div className="security-row"><span>Identität verifizieren</span><button className="text-action" onClick={() => showNotice('Die Schlüsselverifizierung wird mit der E2E-Integration verfügbar.')}>Ansehen <ArrowDownLeft size={13} /></button></div>
          <div className="detail-rule lower-rule" />
          <button className="detail-action" onClick={() => showNotice('Benachrichtigungen verwaltest du in den Geräteeinstellungen.')}><Bell size={17} /> Benachrichtigungen</button>
          <button className="detail-action danger-action" onClick={() => showNotice('Kontakt blockieren wird noch nicht unterstützt.')}><UserRound size={17} /> Kontakt blockieren</button>
          <div className="detail-footnote"><LockKeyhole size={14} /><p>Kein Telefonbuch-Upload.<br />Kontakte per Benutzername finden.</p></div>
        </>}
      </aside>}

      <nav className="app-bottom-nav" aria-label="Hauptnavigation">
        {appSections.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeSection === id ? 'active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => setActiveSection(id)}>
            <Icon size={19} /><span>{label}</span>
          </button>
        ))}
      </nav>

      {notice && <div className="toast" role="status">{notice}</div>}

      {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="icon-button modal-close" aria-label="Schließen" onClick={() => setDialog(null)}><X size={18} /></button>
          {dialog === 'contact' ? <>
            <div className="modal-icon"><Plus size={20} /></div>
            <h2 id="modal-title">Neuen Chat starten</h2>
            <p className="modal-description">Suche nach dem eindeutigen Benutzernamen. Die Person muss bereits ein Konto erstellt haben.</p>
            <form className="modal-form" onSubmit={findContact}>
              <label>Benutzername<input name="username" value={contactUsername} onChange={(event) => setContactUsername(event.target.value)} placeholder="z.B. max_muster" minLength={3} maxLength={24} required autoFocus /></label>
              {contactError && <p className="auth-feedback auth-error" role="alert">{contactError}</p>}
              <button className="primary-button" type="submit" disabled={contactBusy}>{contactBusy ? 'Suche …' : 'Suchen'} <Search size={16} /></button>
            </form>
            {contactResult && <div className="contact-search-result"><Avatar chat={contactToChat(contactResult)} /><span><strong>{contactResult.display_name}</strong><small>@{contactResult.username}</small></span><button className="primary-button" onClick={addContact} disabled={contactBusy}>Hinzufügen <Plus size={15} /></button></div>}
          </> : <>
            <div className="modal-icon"><Settings2 size={20} /></div>
            <h2 id="modal-title">Konto & Sicherheit</h2>
            <p className="modal-description">Dein Konto nutzt E-Mail und Passwort. Für die Anmeldung ist keine 2FA erforderlich.</p>
            <div className="signed-in-email"><span>E-Mail-Adresse</span><strong>{accountEmail}</strong></div>
            <div className="modal-note"><ShieldCheck size={15} /><span>{user.email_confirmed_at ? 'Deine E-Mail-Adresse wurde bestätigt.' : 'Bestätige deine E-Mail-Adresse für mehr Kontosicherheit.'} Die Anmeldung wird von Supabase verwaltet.</span></div>
            <button className="primary-button account-security-button" onClick={onOpenLocalPreview}><Palette size={16} /> Lokale Vorschau bearbeiten</button>
            {isAdmin && <button className="primary-button account-security-button" onClick={onOpenAdmin}><Settings2 size={16} /> Website bearbeiten</button>}
            <button className="logout-button" onClick={signOutAccount}><LogOut size={15} /> Abmelden</button>
          </>}
        </section>
      </div>}
    </main>
  )
}

export default App