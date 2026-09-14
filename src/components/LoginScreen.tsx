import { useState } from 'react'
import type { FormEvent } from 'react'
import { Globe2, LockKeyhole, Mail, Utensils } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!supabase) { setMessage('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.'); return }
    setLoading(true)
    const result = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (result.error) { setMessage(result.error.message); return }
    if (mode === 'signup' && !result.data.session) { setMessage('Akun dibuat. Cek email untuk konfirmasi sebelum login.'); return }
    onAuthenticated()
  }

  async function signInWithGoogle() {
    setMessage('')
    if (!supabase) { setMessage('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) { setLoading(false); setMessage(error.message) }
  }

  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><span className="brand-mark"><Utensils size={18} /></span><strong>Catering<span>Pulse</span></strong></div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="auth-subtitle">Track every meal, vendor, and rupiah in one calm workspace.</p><button type="button" className="google-button" onClick={() => void signInWithGoogle()} disabled={loading}><Globe2 size={17} />Continue with Google</button><div className="auth-divider"><span>or use email</span></div><form onSubmit={submit} className="auth-form"><label>Email<div className="auth-input"><Mail size={16} /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label><label>Password<div className="auth-input"><LockKeyhole size={16} /><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></div></label>{message && <p className="auth-message">{message}</p>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}</button></form><button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button></section></main>
}
