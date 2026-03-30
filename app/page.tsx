'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username || email.split('@')[0] },
          },
        })
        if (error) throw error
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/chat')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

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
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: '4rem',
        maxWidth: '900px',
        width: '100%',
        alignItems: 'center',
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        {/* Left: Hero text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--accent-light)',
            color: 'var(--accent-text)',
            padding: '0.35rem 0.875rem',
            borderRadius: '100px',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            width: 'fit-content',
            fontFamily: 'var(--font-display)',
          }}>
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'pulse-dot 1.5s ease-in-out infinite',
              display: 'inline-block',
            }} />
            Chat em tempo real
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Entre no chat<br />
            <span style={{ color: 'var(--accent)' }}>da sua turma</span><br />
            em segundos.
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.7,
            maxWidth: '380px',
          }}>
            Crie uma conta, entre numa sala com código e comece a conversar em tempo real.
            Simples assim.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            paddingTop: '0.5rem',
          }}>
            {['💬 Mensagens em tempo real', '🔐 Salas privadas por código', '🎨 Tema claro e escuro'].map(f => (
              <div key={f} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg)',
            borderRadius: '0.75rem',
            padding: '4px',
            marginBottom: '1.75rem',
            gap: '4px',
          }}>
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.2s ease',
                  background: mode === m ? 'var(--bg-card)' : 'transparent',
                  color: mode === m ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: mode === m ? 'var(--shadow)' : 'none',
                }}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <Field
                label="Seu nome"
                type="text"
                placeholder="Como quer ser chamado?"
                value={username}
                onChange={setUsername}
              />
            )}
            <Field
              label="E-mail"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={setEmail}
            />
            <Field
              label="Senha"
              type="password"
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={setPassword}
            />

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.85rem',
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--text-muted)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '0.25rem',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                if (!loading) (e.target as HTMLButtonElement).style.background = 'var(--accent-hover)'
              }}
              onMouseLeave={e => {
                if (!loading) (e.target as HTMLButtonElement).style.background = 'var(--accent)'
              }}
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar →' : 'Criar conta →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '1.25rem',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}>
            Respeite a turma. Sem spam.
          </p>
        </div>
      </div>

      {/* Mobile layout fix */}
      <style>{`
        @media (max-width: 700px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
          main > div > div:first-child {
            display: none !important;
          }
        }
      `}</style>
    </main>
  )
}

function Field({
  label, type, placeholder, value, onChange,
}: {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.02em',
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{
          background: 'var(--bg-input)',
          border: '1.5px solid var(--border)',
          borderRadius: '0.625rem',
          padding: '0.75rem 0.875rem',
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          fontFamily: 'var(--font-body)',
          width: '100%',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
