'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  content: string
  username: string
  user_id: string
  created_at: string
}

type Room = {
  id: string
  code: string
  name: string
}

export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomName, setRoomName] = useState('')
  const [joining, setJoining] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [compactMode, setCompactMode] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load user & theme
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      setUsername(profile?.username || user.email?.split('@')[0] || 'Usuário')

      const saved = localStorage.getItem('theme') as 'light' | 'dark' || 'light'
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)

      const savedFont = localStorage.getItem('fontSize') as 'sm' | 'md' | 'lg' || 'md'
      setFontSize(savedFont)

      const savedCompact = localStorage.getItem('compactMode') === 'true'
      setCompactMode(savedCompact)
    }
    init()
  }, [])

  // Subscribe to room messages
  useEffect(() => {
    if (!room) return

    // Load existing messages
    supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!roomCode.trim()) return
    setError('')
    setJoining(true)

    try {
      const code = roomCode.trim().toUpperCase()

      // Busca sala existente
      let { data: existing } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single()

      if (existing) {
        setRoom(existing)
      } else {
        // Cria nova sala
        const name = roomName.trim() || `Sala ${code}`
        const { data: created, error } = await supabase
          .from('rooms')
          .insert({ code, name, created_by: user.id })
          .select()
          .single()

        if (error) throw error
        setRoom(created)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na sala.')
    } finally {
      setJoining(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !room || !user) return
    setSending(true)

    const content = input.trim()
    setInput('')

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: room.id,
        user_id: user.id,
        username,
        content,
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setInput(content) // restore
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function changeTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  function changeFontSize(s: 'sm' | 'md' | 'lg') {
    setFontSize(s)
    localStorage.setItem('fontSize', s)
  }

  function toggleCompact() {
    const next = !compactMode
    setCompactMode(next)
    localStorage.setItem('compactMode', String(next))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const fontSizeMap = { sm: '0.82rem', md: '0.92rem', lg: '1.02rem' }
  const msgFontSize = fontSizeMap[fontSize]
  const msgPadding = compactMode ? '0.5rem 0.75rem' : '0.75rem 1rem'

  // ── JOIN SCREEN ──
  if (!room) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* BG orb */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 440px',
          gap: '5rem',
          maxWidth: '920px',
          width: '100%',
          alignItems: 'center',
          animation: 'fadeUp 0.4s ease forwards',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--accent-light)', color: 'var(--accent-text)',
              padding: '0.35rem 0.875rem', borderRadius: '100px',
              fontSize: '0.8rem', fontWeight: 600, width: 'fit-content',
              fontFamily: 'var(--font-display)',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
                display: 'inline-block',
              }} />
              Entrada rápida
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              Entre no chat<br />
              <span style={{ color: 'var(--accent)' }}>da turma</span><br />
              em um passo.
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '340px' }}>
              Digite seu nome, escolha um código de sala se precisar e comece a conversar em tempo real.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              💬 Respeite a turma. Sem spam.
            </p>

            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1.5px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                width: 'fit-content',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              ← Sair da conta
            </button>
          </div>

          {/* Right: form */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '0.25rem' }}>
                CONECTADO COMO
              </p>
              <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {username}
              </p>
            </div>

            <form onSubmit={joinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                  Código da sala
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                  }}>#</span>
                  <input
                    type="text"
                    placeholder="Ex: TURMA01"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    required
                    maxLength={20}
                    style={{
                      background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                      borderRadius: '0.625rem', padding: '0.75rem 0.875rem 0.75rem 2rem',
                      fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                      width: '100%', fontFamily: 'var(--font-display)', fontWeight: 600,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Se a sala não existir, será criada automaticamente.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                  Nome da sala <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Turma de Design"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  maxLength={50}
                  style={{
                    background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                    borderRadius: '0.625rem', padding: '0.75rem 0.875rem',
                    fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                    width: '100%', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  padding: '0.75rem', borderRadius: '0.625rem', fontSize: '0.85rem',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={joining}
                style={{
                  background: joining ? 'var(--text-muted)' : 'var(--accent)',
                  color: '#fff', border: 'none', borderRadius: '0.75rem',
                  padding: '0.875rem', fontSize: '0.95rem', fontWeight: 700,
                  fontFamily: 'var(--font-display)', cursor: joining ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!joining) e.currentTarget.style.background = 'var(--accent-hover)' }}
                onMouseLeave={e => { if (!joining) e.currentTarget.style.background = 'var(--accent)' }}
              >
                {joining ? 'Entrando...' : 'Entrar →'}
              </button>
            </form>
          </div>
        </div>

        <style>{`
          @media (max-width: 700px) {
            main > div { grid-template-columns: 1fr !important; gap: 2rem !important; }
            main > div > div:first-child { display: none !important; }
          }
        `}</style>
      </main>
    )
  }

  // ── CHAT SCREEN ──
  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
    }}>
      {/* Header */}
      <header style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setRoom(null)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.1rem', padding: '0.25rem',
              borderRadius: '0.375rem', transition: 'color 0.2s',
              display: 'flex', alignItems: 'center',
            }}
            title="Trocar de sala"
          >
            ←
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
              }}>
                {room.name}
              </span>
              <span style={{
                background: 'var(--accent-light)',
                color: 'var(--accent-text)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '100px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em',
              }}>
                #{room.code}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.1rem',
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#22c55e', display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              Ao vivo
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'none' }} className="hide-mobile">
            {username}
          </span>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(s => !s)}
            style={{
              background: showSettings ? 'var(--accent-light)' : 'transparent',
              border: '1.5px solid',
              borderColor: showSettings ? 'var(--accent)' : 'var(--border)',
              borderRadius: '0.5rem',
              padding: '0.4rem 0.7rem',
              cursor: 'pointer',
              color: showSettings ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            ⚙ Configurações
          </button>

          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1.5px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.4rem 0.7rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: '68px',
          right: '1.25rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          width: '280px',
          animation: 'fadeUp 0.2s ease forwards',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            Configurações
          </p>

          {/* Theme */}
          <SettingSection label="Tema">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => changeTheme(t)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem',
                    border: '1.5px solid', cursor: 'pointer',
                    borderColor: theme === t ? 'var(--accent)' : 'var(--border)',
                    background: theme === t ? 'var(--accent-light)' : 'var(--bg)',
                    color: theme === t ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s',
                  }}
                >
                  {t === 'light' ? '☀️ Claro' : '🌙 Escuro'}
                </button>
              ))}
            </div>
          </SettingSection>

          {/* Font size */}
          <SettingSection label="Tamanho do texto">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {([['sm', 'Pequeno'], ['md', 'Médio'], ['lg', 'Grande']] as const).map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => changeFontSize(s)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem',
                    border: '1.5px solid', cursor: 'pointer',
                    borderColor: fontSize === s ? 'var(--accent)' : 'var(--border)',
                    background: fontSize === s ? 'var(--accent-light)' : 'var(--bg)',
                    color: fontSize === s ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </SettingSection>

          {/* Compact mode */}
          <SettingSection label="Modo compacto">
            <button
              onClick={toggleCompact}
              style={{
                width: '100%', padding: '0.55rem', borderRadius: '0.5rem',
                border: '1.5px solid',
                borderColor: compactMode ? 'var(--accent)' : 'var(--border)',
                background: compactMode ? 'var(--accent-light)' : 'var(--bg)',
                color: compactMode ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              }}
            >
              {compactMode ? '✓ Ativado' : 'Desativado'} — mensagens mais próximas
            </button>
          </SettingSection>

          {/* User info */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Conectado como
            </p>
            <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {username}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        onClick={() => setShowSettings(false)}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: compactMode ? '0.35rem' : '0.6rem',
        }}
      >
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            margin: 'auto',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            animation: 'fadeIn 0.4s ease',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💬</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Sala aberta!
            </p>
            <p>Seja o primeiro a enviar uma mensagem.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.user_id === user?.id
          const prevMsg = messages[i - 1]
          const isContinuation = prevMsg && prevMsg.user_id === msg.user_id

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '0.5rem',
                marginTop: isContinuation && !compactMode ? 0 : compactMode ? '0.25rem' : '0.5rem',
                animation: 'slideIn 0.2s ease forwards',
              }}
            >
              {/* Avatar */}
              {!isOwn && (
                <div style={{
                  width: compactMode ? '26px' : '30px',
                  height: compactMode ? '26px' : '30px',
                  borderRadius: '50%',
                  background: `hsl(${stringToHue(msg.username)}, 60%, 55%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: compactMode ? '0.65rem' : '0.72rem',
                  fontWeight: 700, flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  visibility: isContinuation ? 'hidden' : 'visible',
                }}>
                  {msg.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{
                maxWidth: '65%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                gap: '0.2rem',
              }}>
                {!isContinuation && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: isOwn ? 'var(--text-muted)' : `hsl(${stringToHue(msg.username)}, 55%, 50%)`,
                    fontFamily: 'var(--font-display)',
                    paddingLeft: isOwn ? 0 : '0.25rem',
                    paddingRight: isOwn ? '0.25rem' : 0,
                  }}>
                    {isOwn ? 'Você' : msg.username}
                  </span>
                )}
                <div style={{
                  background: isOwn ? 'var(--bubble-own)' : 'var(--bubble-other)',
                  color: isOwn ? 'var(--bubble-own-text)' : 'var(--bubble-other-text)',
                  padding: msgPadding,
                  borderRadius: isOwn
                    ? '1rem 1rem 0.25rem 1rem'
                    : '1rem 1rem 1rem 0.25rem',
                  fontSize: msgFontSize,
                  lineHeight: 1.5,
                  boxShadow: 'var(--shadow)',
                  border: isOwn ? 'none' : '1px solid var(--border)',
                  wordBreak: 'break-word',
                  transition: 'all 0.3s',
                }}>
                  {msg.content}
                </div>
                <span style={{
                  fontSize: '0.65rem', color: 'var(--text-muted)',
                  paddingLeft: isOwn ? 0 : '0.25rem',
                  paddingRight: isOwn ? '0.25rem' : 0,
                }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        style={{
          padding: '0.875rem 1rem',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={500}
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.7rem 1rem',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            background: sending || !input.trim() ? 'var(--border)' : 'var(--accent)',
            color: sending || !input.trim() ? 'var(--text-muted)' : '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.7rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (!sending && input.trim()) e.currentTarget.style.background = 'var(--accent-hover)'
          }}
          onMouseLeave={e => {
            if (!sending && input.trim()) e.currentTarget.style.background = 'var(--accent)'
          }}
        >
          {sending ? '...' : '↑'}
        </button>
      </form>
    </div>
  )
}

function SettingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function stringToHue(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}
