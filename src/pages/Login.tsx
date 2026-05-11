import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkLocalCredentials, setLocalAuth } from '../lib/demo'

// ── Partículas flotantes ────────────────────────────────────────────
type Particle = { x: number; y: number; r: number; dx: number; dy: number; opacity: number }

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const count = 80
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.15,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(134,239,172,${p.opacity})`
        ctx.fill()
      }
      // líneas entre partículas cercanas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(134,239,172,${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

// ── Icono B Corp (logo oficial recreado en blanco) ──────────────────
function BCorpIcon({ size = 56 }: { size?: number }) {
  const h = Math.round(size * 1.22)
  return (
    <svg width={size} height={h} viewBox="0 0 100 122" xmlns="http://www.w3.org/2000/svg">
      {/* Círculo exterior — trazo grueso, sin relleno */}
      <circle cx="50" cy="46" r="39" stroke="white" strokeWidth="6.5" fill="none" />

      {/*
        Letra B: spine vertical + dos bumps D-shape con evenodd.
        Subpath 1: silueta exterior completa (spine + bump superior + bump inferior).
        Subpath 2 y 3: hueco interior de cada bump → crean el vaciado.
      */}
      <path
        fill="white"
        fillRule="evenodd"
        d="
          M 24,14 L 39,14
          A 31,16 0 0,1 39,46
          A 35,16 0 0,1 39,78
          L 24,78 Z

          M 39,21 A 22,10.5 0 0,1 39,42 Z

          M 39,50 A 25,11   0 0,1 39,72 Z
        "
      />

      {/* Barra horizontal inferior */}
      <rect x="11" y="97" width="68" height="8" fill="white" />

      {/* ® — a la derecha de la barra */}
      <text x="82" y="112" fill="white" fontSize="11" fontFamily="serif">®</text>
    </svg>
  )
}

// ── Página principal ────────────────────────────────────────────────
export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (checkLocalCredentials(email, password)) {
        setLocalAuth()
        navigate('/')
      } else {
        setError('Credenciales incorrectas. Inténtalo de nuevo.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050d05 0%, #0a0f1a 50%, #060d10 100%)' }}
    >
      {/* Orbes de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 65%)',
          top: '-200px', left: '-150px',
          animation: 'orbFloat1 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)',
          bottom: '-100px', right: '-100px',
          animation: 'orbFloat2 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 65%)',
          top: '40%', right: '20%',
          animation: 'orbFloat3 10s ease-in-out infinite',
        }} />
      </div>

      {/* Canvas de partículas */}
      <ParticleCanvas />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'rgba(10,18,10,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(134,239,172,0.12)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <BCorpIcon size={56} />
          <h1 className="text-white text-2xl font-bold mt-3 tracking-tight"></h1>
          <p className="text-xs font-semibold tracking-[0.2em] mt-0.5 whitespace-nowrap"
             style={{ color: 'rgba(134,239,172,0.7)' }}>
            SEGUIMIENTO Y CERTIFICACIÓN · XUL
          </p>
          <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Bienvenido/a. Introduce tus credenciales.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold tracking-widest mb-1.5"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              USUARIO
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="usuario@xul.es"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              onFocus={e => e.currentTarget.style.border = '1px solid rgba(134,239,172,0.45)'}
              onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold tracking-widest mb-1.5"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              CONTRASEÑA
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all pr-10"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={e => e.currentTarget.style.border = '1px solid rgba(134,239,172,0.45)'}
                onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {showPass ? '✕' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all mt-2 relative overflow-hidden"
            style={{
              background: loading
                ? 'rgba(124,58,237,0.5)'
                : 'linear-gradient(135deg, #7c3aed 0%, #16a34a 100%)',
              boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.35)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Accediendo...
              </span>
            ) : 'Acceder al Panel'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.18)' }}>
          XUL · © {new Date().getFullYear()}
        </p>
      </div>

      {/* CSS keyframes para los orbes */}
      <style>{`
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-60px) scale(1.08); }
          66%      { transform: translate(-30px,30px) scale(0.94); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-50px,40px) scale(1.05); }
          70%      { transform: translate(30px,-20px) scale(0.96); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-40px) scale(1.1); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
