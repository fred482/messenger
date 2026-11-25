import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowDownLeft,
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
  Mic,
  MicOff,
  Music,
  MoreHorizontal,
  Paperclip,
  Palette,
  Phone,
  PhoneCall,
  Video,
  VideoOff,
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
  { id: 'messages', label: 'Chats', icon: MessageCircle },
  { id: 'calls', label: 'Anrufe', icon: Phone },
  { id: 'contacts', label: 'Kontakte', icon: UserRound },
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

const demoColleagueStatuses = [
  { chatId: 'lena', caption: 'Ein schöner Abend am Meer', time: 'vor 20 Min.', theme: 'coral' },
  { chatId: 'jonas', caption: 'Neue Fotos aus dem Wochenende', time: 'vor 2 Std.', theme: 'blue' },
  { chatId: 'amira', caption: 'Das Rezept ist fertig!', time: 'vor 5 Std.', theme: 'green' },
]

const demoMomentoPosts = [
  { id: 'demo-momento-lena', chatId: 'lena', caption: 'Ein ruhiger Abend am Meer', audience: 'friends', mediaType: 'image', filter: 'warm', likes: 24, liked: false },
  { id: 'demo-momento-jonas', chatId: 'jonas', caption: 'Neue Momente aus dem Wochenende', audience: 'friends', mediaType: 'image', filter: 'none', likes: 18, liked: false },
  { id: 'demo-momento-amira', chatId: 'amira', caption: 'Für alle: Das beste Rezept der Woche', audience: 'all', mediaType: 'image', filter: 'cool', likes: 41, liked: false },
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
  const [mobileInboxOpen, setMobileInboxOpen] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  const [search, setSearch] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [message, setMessage] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(() => window.matchMedia('(min-width: 1081px)').matches)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const [contactUsername, setContactUsername] = useState('')
  const [contactResult, setContactResult] = useState(null)
  const [contactError, setContactError] = useState('')
  const [contactBusy, setContactBusy] = useState(false)
  const [statusImages, setStatusImages] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(`klartext-statuses:${user.id}`) || '[]')
      if (!Array.isArray(saved)) return []
      const now = Date.now()
      return saved.filter((status) => Number.isFinite(status.createdAt) && now - status.createdAt < 24 * 60 * 60 * 1000)
    } catch {
      return []
    }
  })
  const [statusClock, setStatusClock] = useState(Date.now())
  const [momentoPosts, setMomentoPosts] = useState([])
  const [momentImage, setMomentImage] = useState('')
  const [momentCaption, setMomentCaption] = useState('')
  const [momentMediaType, setMomentMediaType] = useState('image')
  const [momentFilter, setMomentFilter] = useState('none')
  const [momentMusic, setMomentMusic] = useState('')
  const [momentMusicName, setMomentMusicName] = useState('')
  const [momentAudience, setMomentAudience] = useState('friends')
  const [momentFeedAudience, setMomentFeedAudience] = useState('friends')
  const messageEnd = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const signalingChannelRef = useRef(null)
  const pendingOfferRef = useRef(null)
  const pendingCandidatesRef = useRef([])
  const activeCallHistoryIdRef = useRef(null)
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [callHistory, setCallHistory] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(`klartext-call-history:${user.id}`) || '[]')
      if (Array.isArray(saved) && saved.length > 0) return saved
    } catch {
      // Start with demo entries below if no valid history is stored.
    }
    if (demoMode) {
      const now = Date.now()
      return [
        { id: 'demo-call-1', chatId: 'lena', chatName: 'Lena Hoffmann', initials: 'LH', color: 'coral', kind: 'video', direction: 'incoming', status: 'Verbunden', startedAt: new Date(now - 15 * 60 * 1000).toISOString(), connectedAt: new Date(now - 14 * 60 * 1000).toISOString(), endedAt: new Date(now - 12 * 60 * 1000).toISOString() },
        { id: 'demo-call-2', chatId: 'jonas', chatName: 'Jonas Richter', initials: 'JR', color: 'blue', kind: 'audio', direction: 'outgoing', status: 'Nicht angenommen', startedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(), connectedAt: null, endedAt: new Date(now - 24 * 60 * 60 * 1000 + 30000).toISOString() },
        { id: 'demo-call-3', chatId: 'amira', chatName: 'Amira Yilmaz', initials: 'AY', color: 'green', kind: 'video', direction: 'outgoing', status: 'Beendet', startedAt: new Date(now - 49 * 60 * 60 * 1000).toISOString(), connectedAt: new Date(now - 49 * 60 * 60 * 1000 + 10000).toISOString(), endedAt: new Date(now - 49 * 60 * 60 * 1000 + 600000).toISOString() },
      ]
    }
    return []
  })

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
  const visibleContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase()
    if (!query) return chats
    return chats.filter((chat) => `${chat.name} ${chat.email} ${chat.username ?? ''}`.toLowerCase().includes(query))
  }, [chats, contactSearch])
  const momentoFeedPosts = useMemo(() => {
    const ownPosts = momentoPosts
      .filter((post) => momentFeedAudience === 'all' || post.audience === 'friends')
      .map((post) => ({ ...post, demo: false }))
    const demoPosts = demoMomentoPosts
      .filter((post) => momentFeedAudience === 'all' || post.audience === 'friends')
      .map((post) => ({ ...post, demo: true }))
    return [...ownPosts, ...demoPosts]
  }, [momentoPosts, momentFeedAudience])

  function showNotice(text) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3200)
  }

  function openChat(chat) {
    setActiveId(chat.id)
    setActiveSection('messages')
    setMobileInboxOpen(false)
  }

  function navigateToSection(sectionId) {
    setActiveSection(sectionId)
    if (sectionId === 'messages') {
      setMobileInboxOpen(window.matchMedia('(max-width: 700px)').matches)
    }
  }

  function persistCallHistory(entries) {
    setCallHistory(entries)
    try {
      window.localStorage.setItem(`klartext-call-history:${user.id}`, JSON.stringify(entries))
    } catch {
      showNotice('Die Anrufhistorie konnte nicht gespeichert werden.')
    }
  }

  function addCallHistory(chat, kind, direction, status = 'Anklopfen') {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      chatId: chat.id,
      chatName: chat.name,
      initials: chat.initials,
      color: chat.color,
      kind,
      direction,
      status,
      startedAt: new Date().toISOString(),
      connectedAt: null,
      endedAt: null,
    }
    activeCallHistoryIdRef.current = entry.id
    setCallHistory((current) => {
      const entries = [entry, ...current].slice(0, 100)
      try {
        window.localStorage.setItem(`klartext-call-history:${user.id}`, JSON.stringify(entries))
      } catch {
        // The in-memory history remains available if browser storage is unavailable.
      }
      return entries
    })
    return entry.id
  }

  function updateCallHistory(id, changes) {
    if (!id) return
    setCallHistory((current) => {
      const entries = current.map((entry) => {
        if (entry.id !== id) return entry
        if (changes.autoEnd) {
          const status = entry.status === 'Verbunden'
            ? 'Beendet'
            : entry.direction === 'incoming'
              ? 'Verpasst'
              : 'Nicht angenommen'
          return { ...entry, status, endedAt: changes.endedAt }
        }
        return { ...entry, ...changes }
      })
      try {
        window.localStorage.setItem(`klartext-call-history:${user.id}`, JSON.stringify(entries))
      } catch {
        // The in-memory history remains available if browser storage is unavailable.
      }
      return entries
    })
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

  useEffect(() => {
    if (demoMode || !supabase) return undefined

    const channels = chats.map((chat) => {
      const channel = getCallChannel(chat)
      if (!channel) return null

      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!payload || payload.target !== user.id) return

        if (payload.type === 'offer') {
          pendingOfferRef.current = payload
          signalingChannelRef.current = channel
          addCallHistory(chat, payload.kind, 'incoming', 'Anklopfen')
          setIncomingCall({ kind: payload.kind, name: chat.name, chat })
        } else if (payload.type === 'answer') {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.description))
            for (const candidate of pendingCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            }
            pendingCandidatesRef.current = []
            updateCallHistory(activeCallHistoryIdRef.current, { status: 'Verbunden', connectedAt: new Date().toISOString() })
            setActiveCall((current) => current ? { ...current, status: 'Verbunden' } : current)
          }
        } else if (payload.type === 'candidate') {
          if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
          } else {
            pendingCandidatesRef.current.push(payload.candidate)
          }
        } else if (payload.type === 'end') {
          peerConnectionRef.current?.close()
          peerConnectionRef.current = null
          closeLocalMedia()
          pendingOfferRef.current = null
          pendingCandidatesRef.current = []
          updateCallHistory(activeCallHistoryIdRef.current, { autoEnd: true, endedAt: new Date().toISOString() })
          activeCallHistoryIdRef.current = null
          setActiveCall(null)
          setIncomingCall(null)
          setMuted(false)
          setCameraOff(false)
        }
      }).subscribe()
      return channel
    }).filter(Boolean)

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel))
      if (signalingChannelRef.current && channels.includes(signalingChannelRef.current)) {
        signalingChannelRef.current = null
      }
    }
  }, [demoMode, supabase, user.id, chats])

  useEffect(() => {
    if (activeCall && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [activeCall])

  useEffect(() => {
    if (statusImages.length === 0) return undefined
    const timer = window.setInterval(() => {
      const now = Date.now()
      setStatusClock(now)
      setStatusImages((current) => current.filter((status) => now - status.createdAt < 24 * 60 * 60 * 1000))
    }, 60 * 1000)
    return () => window.clearInterval(timer)
  }, [statusImages.length])

  useEffect(() => {
    try {
      window.localStorage.setItem(`klartext-statuses:${user.id}`, JSON.stringify(statusImages))
    } catch {
      showNotice('Der Status konnte nicht gespeichert werden.')
    }
  }, [statusImages, user.id])

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

  function getCallChannel(chat) {
    if (!supabase || demoMode || !chat?.id) return null
    const participants = [String(user.id), String(chat.id)].sort()
    return supabase.channel(`call:${participants[0]}:${participants[1]}`)
  }

  async function broadcastCallSignal(payload) {
    await signalingChannelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload,
    })
  }

  function closeLocalMedia() {
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
  }

  function endCall(notifyPeer = true) {
    const target = incomingCall?.chat?.id ?? activeChat?.id
    if (notifyPeer) broadcastCallSignal({ type: 'end', sender: user.id, target })
    updateCallHistory(activeCallHistoryIdRef.current, {
      status: activeCall?.status === 'Verbunden' ? 'Beendet' : incomingCall ? 'Abgelehnt' : 'Nicht angenommen',
      endedAt: new Date().toISOString(),
    })
    activeCallHistoryIdRef.current = null
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    pendingOfferRef.current = null
    pendingCandidatesRef.current = []
    closeLocalMedia()
    setActiveCall(null)
    setIncomingCall(null)
    setMuted(false)
    setCameraOff(false)
  }

  function createPeerConnection(chat) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })
    peerConnectionRef.current = peerConnection

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        broadcastCallSignal({
          type: 'candidate',
          sender: user.id,
          target: chat.id,
          candidate: event.candidate,
        })
      }
    }
    peerConnection.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(peerConnection.connectionState)) {
        endCall(false)
      }
    }
    return peerConnection
  }

  async function startCall(kind, targetChat = activeChat) {
    if (!targetChat) return
    if (demoMode) {
      addCallHistory(targetChat, kind, 'outgoing', 'Verbunden')
      setActiveCall({ kind, status: 'Demo-Verbindung', name: targetChat.name })
      setMuted(false)
      setCameraOff(false)
      return
    }
    if (!supabase) {
      showNotice('Für echte Audio- und Videoanrufe melde dich mit einem Supabase-Konto an.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showNotice('Anrufe werden von diesem Browser nicht unterstützt.')
      return
    }

    try {
      signalingChannelRef.current = getCallChannel(targetChat)
      signalingChannelRef.current?.subscribe()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' })
      addCallHistory(targetChat, kind, 'outgoing', 'Anklopfen')
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      setActiveCall({ kind, status: 'Verbindung wird hergestellt…', name: targetChat.name })

      const peerConnection = createPeerConnection(targetChat)
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      await broadcastCallSignal({
        type: 'offer',
        sender: user.id,
        target: targetChat.id,
        kind,
        description: peerConnection.localDescription,
      })
    } catch (callError) {
      closeLocalMedia()
      setActiveCall(null)
      showNotice(`Anruf konnte nicht gestartet werden: ${callError instanceof Error ? callError.message : 'Keine Kameraberechtigung.'}`)
    }
  }

  async function acceptCall() {
    if (!incomingCall) return
    updateCallHistory(activeCallHistoryIdRef.current, {
      status: 'Verbunden',
      connectedAt: new Date().toISOString(),
    })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.kind === 'video' })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      setActiveCall({ kind: incomingCall.kind, status: 'Verbunden', name: incomingCall.name })

      const peerConnection = createPeerConnection(incomingCall.chat)
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))
      await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current.description))
      for (const candidate of pendingCandidatesRef.current) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      }
      pendingCandidatesRef.current = []
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      await broadcastCallSignal({
        type: 'answer',
        sender: user.id,
        target: incomingCall.chat.id,
        description: peerConnection.localDescription,
      })
      setIncomingCall(null)
    } catch (callError) {
      endCall(true)
      showNotice(`Anruf konnte nicht angenommen werden: ${callError instanceof Error ? callError.message : 'Keine Kameraberechtigung.'}`)
    }
  }

  function toggleMute() {
    const nextMuted = !muted
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted })
    setMuted(nextMuted)
  }

  function toggleCamera() {
    const nextCameraOff = !cameraOff
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !nextCameraOff })
    setCameraOff(nextCameraOff)
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
      const now = Date.now()
      setStatusClock(now)
      setStatusImages((current) => [{ id: now, image, createdAt: now }, ...current])
    } catch (uploadError) {
      showNotice(`Bild konnte nicht hinzugefügt werden: ${uploadError instanceof Error ? uploadError.message : 'Unbekannter Fehler.'}`)
    }
  }

  async function selectMomentImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      if (file.type.startsWith('video/')) {
        if (file.size > 25 * 1024 * 1024) throw new Error('Das Video darf höchstens 25 MB groß sein.')
        const videoData = await readImageFile(file)
        const duration = await new Promise((resolve, reject) => {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => resolve(video.duration)
          video.onerror = () => reject(new Error('Das Video konnte nicht gelesen werden.'))
          video.src = videoData
        })
        if (!Number.isFinite(duration)) {
          throw new Error('Das Video konnte nicht gelesen werden.')
        }
        setMomentMediaType('video')
        setMomentImage(videoData)
      } else {
        setMomentMediaType('image')
        setMomentImage(await getLocalImage(file))
      }
    } catch (uploadError) {
      showNotice(`Medium konnte nicht geladen werden: ${uploadError instanceof Error ? uploadError.message : 'Unbekannter Fehler.'}`)
    }
  }

  async function selectMomentMusic(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      showNotice('Bitte wähle eine Audiodatei aus.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotice('Die Musikdatei darf höchstens 10 MB groß sein.')
      return
    }
    try {
      setMomentMusic(await readImageFile(file))
      setMomentMusicName(file.name)
    } catch {
      showNotice('Die Musikdatei konnte nicht geladen werden.')
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
      mediaType: momentMediaType,
      maxDuration: momentMediaType === 'video' ? 80 : null,
      filter: momentFilter,
      music: momentMusic,
      musicName: momentMusicName,
      audience: momentAudience,
      caption: momentCaption.trim(),
      likes: 0,
      liked: false,
    }, ...current])
    setMomentImage('')
    setMomentCaption('')
    setMomentMediaType('image')
    setMomentFilter('none')
    setMomentMusic('')
    setMomentMusicName('')
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

    if (demoMode) {
      if (chats.some((chat) => chat.username === username)) {
        setContactError('Dieser Kontakt ist bereits in deiner Liste.')
        return
      }
      const displayName = username.split(/[_-]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
      setContactResult({ id: `demo-${username}`, username, display_name: displayName })
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
    if (demoMode) {
      const chat = contactToChat(contactResult)
      setChats((current) => [chat, ...current.filter((existing) => existing.id !== chat.id)])
      setActiveId(chat.id)
      setDialog(null)
      showNotice(`${chat.name} wurde zu deinen Kontakten hinzugefügt.`)
      return
    }

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

  function formatCallTime(isoTime) {
    const date = new Date(isoTime)
    if (Number.isNaN(date.getTime())) return ''
    const today = new Date()
    const sameDay = today.toDateString() === date.toDateString()
    if (sameDay) {
      return `Heute, ${new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date)}`
    }
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
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
            <button key={chat.id} className={`chat-row ${activeId === chat.id ? 'active' : ''}`} onClick={() => openChat(chat)}>
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

      {activeSection === 'messages' ? mobileInboxOpen ? <section className="mobile-inbox" aria-label="Nachrichten">
        <header className="mobile-inbox-header">
          <div className="brand-mark">{siteSettings.logo_text || <MessageCircle size={19} strokeWidth={2.5} />}</div>
          <div><span className="activity-eyebrow">NACHRICHTEN</span><h1>Deine Chats</h1></div>
          <button className="icon-button new-chat" aria-label="Neuen Chat starten" title={demoMode ? 'Nur mit Anmeldung verfügbar' : 'Neuen Chat starten'} onClick={openContactDialog} disabled={demoMode}><Plus size={18} /></button>
        </header>
        <label className="mobile-search-box">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Chats durchsuchen" aria-label="Chats durchsuchen" />
          {search && <button type="button" aria-label="Suche löschen" onClick={() => setSearch('')}><X size={15} /></button>}
        </label>
        <div className="mobile-chat-list">
          {visibleChats.map((chat) => (
            <button key={chat.id} className={`chat-row ${activeId === chat.id ? 'active' : ''}`} onClick={() => openChat(chat)}>
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
      </section> : <section className="conversation" aria-label={`Chat mit ${activeChat?.name}`}>
        <header className="conversation-header">
          <button className="icon-button back-button" aria-label="Zur Chatübersicht" title="Zurück zu Chats" onClick={() => { setDetailsOpen(false); setMobileInboxOpen(true) }}><ArrowLeft size={19} /></button>
          {activeChat && <Avatar chat={activeChat} size="small" />}
          <div className="conversation-person"><strong>{activeChat?.name}</strong><span>{activeChat?.online ? 'Gerade online' : activeChat?.username ? `@${activeChat.username}` : activeChat?.email}</span></div>
          <div className="header-actions">
            <button className="icon-button header-call-button phone-call-button" aria-label={`Sprachanruf mit ${activeChat?.name} starten`} title="Sprachanruf" onClick={() => startCall('audio')}><span className="header-call-emoji" aria-hidden="true">📞</span></button>
            <button className="icon-button header-call-button video-call-button" aria-label={`Videoanruf mit ${activeChat?.name} starten`} title="Videoanruf" onClick={() => startCall('video')}><span className="header-call-emoji" aria-hidden="true">📹</span></button>
            <button className={`icon-button details-toggle ${detailsOpen ? 'selected' : ''}`} aria-label="Sicherheitsdetails anzeigen" title="Sicherheitsdetails" onClick={() => setDetailsOpen((open) => !open)}><SlidersHorizontal size={18} /></button>
            <button className="icon-button header-menu-button" aria-label="Weitere Chatoptionen" onClick={() => showNotice('Weitere Chatoptionen folgen im nächsten Entwicklungsschritt.')}><MoreHorizontal size={20} /></button>
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
          <header className="activity-heading"><div><span className="activity-eyebrow">VERBUNDEN BLEIBEN</span><h1>Anrufe</h1><p>Starte einen sicheren Audio- oder Videoanruf mit einem deiner Kontakte.</p></div></header>
          <div className="call-list">
            {callHistory.length > 0 ? callHistory.map((entry) => {
              const chat = chats.find((item) => item.id === entry.chatId) ?? {
                id: entry.chatId,
                name: entry.chatName,
                initials: entry.initials,
                color: entry.color,
              }
              const directionText = entry.direction === 'incoming' ? 'Eingehender' : 'Ausgehender'
              const kindText = entry.kind === 'video' ? 'Videoanruf' : 'Sprachanruf'
              return (
                <article className="call-row" key={entry.id}>
                  <Avatar chat={chat} />
                  <div className="call-copy">
                    <strong>{entry.chatName}</strong>
                    <span className="call-meta-line">
                      {entry.direction === 'incoming' ? <ArrowDownLeft size={13} /> : <PhoneCall size={13} />}
                      {directionText} {kindText} · {formatCallTime(entry.startedAt)}
                    </span>
                    <small className={`call-status call-status-${entry.status === 'Verbunden' || entry.status === 'Beendet' ? 'done' : 'missed'}`}>{entry.status}</small>
                  </div>
                  <button className="icon-button call-action" aria-label={`Erneut als ${entry.kind === 'video' ? 'Video' : 'Audio'} anrufen`} onClick={() => { openChat(chat); window.setTimeout(() => startCall(entry.kind, chat), 0) }}>
                    {entry.kind === 'video' ? <Video size={18} /> : <PhoneCall size={18} />}
                  </button>
                </article>
              )
            }) : <div className="activity-empty"><Phone size={27} /><strong>Noch keine Anrufhistorie</strong><span>Ausgehende und angenommene Anrufe erscheinen hier.</span></div>}
          </div>
        </>}

        {activeSection === 'contacts' && <>
          <header className="activity-heading"><div><span className="activity-eyebrow">DEINE LISTE</span><h1>Kontakte</h1><p>Finde einen Kontakt und öffne einen Chat oder starte einen Anruf.</p></div><button className="secondary-button add-contact-button" aria-label="Neuen Kontakt hinzufügen" title="Neuen Kontakt hinzufügen" onClick={openContactDialog}><Plus size={16} /><span>Neuen Kontakt hinzufügen</span></button></header>
          <label className="contact-search-box">
            <Search size={17} />
            <input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Kontakte durchsuchen" aria-label="Kontakte durchsuchen" />
            {contactSearch && <button type="button" aria-label="Suche löschen" onClick={() => setContactSearch('')}><X size={15} /></button>}
          </label>
          {visibleContacts.length > 0 ? <div className="contact-list">
            {visibleContacts.map((chat) => (
              <article className="contact-row" key={chat.id}>
                <button className="contact-profile-button" onClick={() => openChat(chat)}>
                  <Avatar chat={chat} />
                  <span className="contact-copy"><strong>{chat.name}</strong><small>{chat.username ? `@${chat.username}` : chat.email}</small></span>
                </button>
                <div className="contact-actions">
                  <button className="icon-button call-action" aria-label={`Sprachanruf mit ${chat.name}`} onClick={() => { openChat(chat); window.setTimeout(() => startCall('audio', chat), 0) }}><PhoneCall size={18} /></button>
                  <button className="icon-button call-action" aria-label={`Videoanruf mit ${chat.name}`} onClick={() => { openChat(chat); window.setTimeout(() => startCall('video', chat), 0) }}><Video size={18} /></button>
                  <button className="icon-button contact-message-action" aria-label={`Nachricht an ${chat.name}`} onClick={() => openChat(chat)}><MessageCircle size={18} /></button>
                </div>
              </article>
            ))}
          </div> : <div className="activity-empty"><Search size={27} /><strong>Keine Kontakte gefunden</strong><span>Versuche einen anderen Namen oder Benutzernamen.</span></div>}
        </>}

        {activeSection === 'status' && <>
          <header className="activity-heading"><div><span className="activity-eyebrow">LOKALER STATUS</span><h1>Status</h1><p>Teile ein Bild als lokalen Status. Es wird nicht hochgeladen oder mit anderen geteilt.</p></div></header>
          <label className="status-upload-card">
            <span className="status-upload-icon"><ImagePlus size={23} /></span>
            <strong>Bild zum Status hinzufügen</strong>
            <small>JPG, PNG oder ein anderes Bild · maximal 4 MB · sichtbar für 24 Stunden</small>
            <input type="file" accept="image/*" onChange={addStatusImage} />
          </label>
          {statusImages.filter((status) => statusClock - status.createdAt < 24 * 60 * 60 * 1000).length > 0 ? <div className="status-grid">
            {statusImages.filter((status) => statusClock - status.createdAt < 24 * 60 * 60 * 1000).map((status) => (
              <article className="status-card" key={status.id}>
                <img src={status.image} alt="Dein lokaler Status" />
                <span>Dein Status · vor {Math.max(1, Math.floor((statusClock - status.createdAt) / 60000))} Min.</span>
              </article>
            ))}
          </div> : <div className="activity-empty"><Camera size={27} /><strong>Noch kein Status</strong><span>Wähle ein Bild aus, um es hier lokal anzusehen.</span></div>}
          <section className="colleague-statuses">
            <div className="colleague-status-heading"><strong>Status von Kollegen</strong><span>{demoColleagueStatuses.length} neue Updates</span></div>
            <div className="colleague-status-list">
              {demoColleagueStatuses.map((status) => {
                const chat = chats.find((item) => item.id === status.chatId)
                if (!chat) return null
                return (
                  <button className="colleague-status-row" key={status.chatId} onClick={() => openChat(chat)}>
                    <span className={`colleague-status-ring theme-${status.theme}`}><Avatar chat={chat} /></span>
                    <span className="colleague-status-copy"><strong>{chat.name}</strong><small>{status.caption}</small></span>
                    <time>{status.time}</time>
                  </button>
                )
              })}
            </div>
          </section>
        </>}

        {activeSection === 'momento' && <>
          <header className="activity-heading momento-heading"><div><span className="activity-eyebrow">FOTOS & SHORTS</span><h1>Momento</h1><p>Teile Fotos oder kurze Videos mit Filtern und Hintergrundmusik — alles nur lokal in dieser Sitzung.</p></div></header>
          <div className="momento-view-switch" role="group" aria-label="Momento-Freigabe und Feed auswählen">
            <button type="button" className={momentFeedAudience === 'friends' ? 'active' : ''} onClick={() => { setMomentFeedAudience('friends'); setMomentAudience('friends') }}>Freunde</button>
            <button type="button" className={momentFeedAudience === 'all' ? 'active' : ''} onClick={() => { setMomentFeedAudience('all'); setMomentAudience('all') }}>Alle Nutzer</button>
          </div>
          <form className="momento-composer" onSubmit={publishMoment}>
            <label className="momento-image-picker">
              {momentImage ? (momentMediaType === 'video'
                ? <video
                    className={`momento-preview filter-${momentFilter}`}
                    src={momentImage}
                    muted
                    autoPlay
                    playsInline
                    onTimeUpdate={(event) => {
                      if (event.currentTarget.currentTime >= 80) {
                        event.currentTarget.pause()
                        event.currentTarget.currentTime = 80
                      }
                    }}
                  />
                : <img className={`momento-preview filter-${momentFilter}`} src={momentImage} alt="Ausgewählter Momento-Beitrag" />)
                : <><ImagePlus size={25} /><span>Foto oder Short auswählen · max. 1:20 Min.</span></>}
              {momentImage && momentFilter === 'dog' && <span className="momento-dog-overlay" aria-hidden="true"><i className="dog-ear dog-ear-left" /><i className="dog-ear dog-ear-right" /><i className="dog-nose" /></span>}
              <input type="file" accept="image/*,video/*" onChange={selectMomentImage} />
            </label>
            <div className="momento-compose-fields">
              <div className="momento-audience-switch" role="group" aria-label="Sichtbarkeit des Beitrags">
                <button type="button" className={momentAudience === 'friends' ? 'active' : ''} onClick={() => setMomentAudience('friends')}>Mit Freunden teilen</button>
                <button type="button" className={momentAudience === 'all' ? 'active' : ''} onClick={() => setMomentAudience('all')}>Mit allen App-Nutzern</button>
              </div>
              <div className="momento-type-switch" role="group" aria-label="Beitragsart">
                <button type="button" className={momentMediaType === 'image' ? 'active' : ''} onClick={() => setMomentMediaType('image')}><ImagePlus size={14} /> Foto</button>
                <button type="button" className={momentMediaType === 'video' ? 'active' : ''} onClick={() => setMomentMediaType('video')}><Camera size={14} /> Short</button>
              </div>
              <div className="momento-filter-row" aria-label="Filter">
                {['none', 'warm', 'cool', 'vintage', 'dog'].map((filter) => (
                  <button type="button" key={filter} className={`momento-filter filter-${filter} ${momentFilter === filter ? 'active' : ''}`} onClick={() => setMomentFilter(filter)}>
                    {filter === 'none' ? 'Original' : filter === 'warm' ? 'Warm' : filter === 'cool' ? 'Kühl' : filter === 'vintage' ? 'Vintage' : 'Hunde'}
                  </button>
                ))}
              </div>
              <textarea value={momentCaption} onChange={(event) => setMomentCaption(event.target.value)} maxLength={240} placeholder="Beschreibung oder Caption…" aria-label="Bild- oder Videobeschreibung" />
              <label className="momento-music-button"><Music size={15} /><span>{momentMusicName || 'Hintergrundmusik wählen'}</span><input type="file" accept="audio/*" onChange={selectMomentMusic} /></label>
              {momentMusic && <audio controls src={momentMusic} className="momento-music-preview" />}
              <button className="primary-button" type="submit" disabled={!momentImage}>In Momento teilen <Send size={15} /></button>
            </div>
          </form>
          <section className="momento-feed-section">
            <div className="momento-feed-heading">
              <strong>{momentFeedAudience === 'friends' ? 'Momento von Freunden' : 'Momento von allen Nutzern'}</strong>
            </div>
            {momentoFeedPosts.length > 0 ? <div className="momento-feed">
              {momentoFeedPosts.map((post) => {
                const demoChat = post.demo ? chats.find((chat) => chat.id === post.chatId) : null
                const authorName = post.demo ? demoChat?.name : accountName
                const authorInitial = post.demo ? demoChat?.initials : accountInitial
                const authorColor = post.demo ? `account-avatar avatar-${demoChat?.color}` : 'account-avatar'
                return (
                  <article className="momento-post" key={post.id}>
                    <header><div className={authorColor}>{authorInitial}</div><strong>{authorName}</strong><span>{post.mediaType === 'video' ? 'Short' : 'Foto'} · gerade eben</span></header>
                    <div className="momento-post-media-wrap">
                      {post.image
                        ? post.mediaType === 'video'
                          ? <video className={`momento-post-media filter-${post.filter}`} src={post.image} controls playsInline />
                          : <img className={`momento-post-media filter-${post.filter}`} src={post.image} alt={post.caption || 'Lokaler Momento-Beitrag'} />
                        : <div className={`momento-demo-media momento-demo-${post.filter}`}><ImagePlus size={28} /><span>{post.caption}</span></div>}
                      {post.filter === 'dog' && <span className="momento-dog-overlay" aria-hidden="true"><i className="dog-ear dog-ear-left" /><i className="dog-ear dog-ear-right" /><i className="dog-nose" /></span>}
                    </div>
                    <div className="momento-post-actions"><button className={post.liked ? 'liked' : ''} onClick={() => post.demo ? null : toggleMomentLike(post.id)} aria-label={post.liked ? 'Gefällt mir entfernen' : 'Gefällt mir'}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} /></button><span>{post.likes} gefällt das</span></div>
                    {post.caption && <p><strong>{authorName}</strong> {post.caption}</p>}
                    {post.music && <div className="momento-post-music"><Music size={14} /><span>{post.musicName}</span><audio controls src={post.music} /></div>}
                  </article>
                )
              })}
            </div> : <div className="activity-empty"><ImagePlus size={27} /><strong>Dein Momento-Feed</strong><span>Wähle oben ein Foto oder einen Short aus und teile deinen ersten Moment.</span></div>}
          </section>
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
        {appSections.map(({ id, label, icon: Icon }) => {
          const showBackToChats = id === 'messages' && activeSection === 'messages' && !mobileInboxOpen
          const NavIcon = showBackToChats ? ArrowLeft : Icon
          return (
            <button key={id} className={`${activeSection === id ? 'active' : ''} ${showBackToChats ? 'back-to-chats' : ''}`} aria-label={showBackToChats ? 'Zurück zu allen Chats' : id === 'messages' ? 'Zur Chatübersicht' : label} aria-current={activeSection === id ? 'page' : undefined} onClick={() => navigateToSection(id)}>
              <NavIcon size={19} /><span>{showBackToChats ? 'Alle Chats' : label}</span>
            </button>
          )
        })}
      </nav>

      {incomingCall && <div className="call-backdrop">
        <section className="incoming-call" role="dialog" aria-modal="true" aria-label="Eingehender Anruf">
          <div className="call-avatar"><Avatar chat={incomingCall.chat} size="large" /></div>
          <h2>{incomingCall.name}</h2>
          <p>Eingehender {incomingCall.kind === 'video' ? 'Videoanruf' : 'Audioanruf'}…</p>
          <div className="incoming-call-actions">
            <button className="call-control call-reject" aria-label="Anruf ablehnen" onClick={() => endCall(true)}><Phone size={22} /></button>
            <button className="call-control call-accept" aria-label="Anruf annehmen" onClick={acceptCall}>{incomingCall.kind === 'video' ? <Video size={22} /> : <Phone size={22} />}</button>
          </div>
        </section>
      </div>}

      {activeCall && <div className={`active-call active-call-${activeCall.kind}`} role="dialog" aria-label={`${activeCall.kind === 'video' ? 'Videoanruf' : 'Audioanruf'} mit ${activeCall.name}`}>
        <div className="active-call-info"><strong>{activeCall.name}</strong><span>{activeCall.status}</span></div>
        {activeCall.kind === 'video' && (demoMode
          ? <div className="demo-video-canvas"><Avatar chat={activeChat} size="large" /><span>Demo-Videoanruf</span></div>
          : <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />)}
        {activeCall.kind === 'video' && (demoMode
          ? null
          : <video ref={localVideoRef} className="local-video" autoPlay muted playsInline />)}
        {activeCall.kind === 'audio' && <div className="audio-call-avatar"><Avatar chat={activeChat} size="large" /></div>}
        <div className="call-controls">
          <button className={`call-control ${muted ? 'active' : ''}`} aria-label={muted ? 'Mikrofon einschalten' : 'Mikrofon stummschalten'} onClick={toggleMute}>{muted ? <MicOff size={21} /> : <Mic size={21} />}</button>
          {activeCall.kind === 'video' && <button className={`call-control ${cameraOff ? 'active' : ''}`} aria-label={cameraOff ? 'Kamera einschalten' : 'Kamera ausschalten'} onClick={toggleCamera}>{cameraOff ? <VideoOff size={21} /> : <Video size={21} />}</button>}
          <button className="call-control call-reject" aria-label="Anruf beenden" onClick={() => endCall(true)}><Phone size={22} /></button>
        </div>
      </div>}

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