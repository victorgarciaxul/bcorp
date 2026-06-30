import { useState } from 'react'
import { sql } from '../../lib/db'

interface Props {
  type: 'internal' | 'external'
}

export default function SuggestionForm({ type }: Props) {
  const [authorName, setAuthorName] = useState('')
  const [email, setEmail] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await sql`
        INSERT INTO suggestions (type, author_name, email, is_anonymous, subject, message, status)
        VALUES (${type}, ${isAnonymous ? null : authorName || null}, ${isAnonymous ? null : email || null},
                ${isAnonymous}, ${subject}, ${message}, 'new')
      `
      setSubmitted(true)
    } catch {
      setError('Ha ocurrido un error. Inténtalo de nuevo.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Gracias por tu sugerencia!</h2>
          <p className="text-gray-500 text-sm">Tu mensaje ha sido recibido y será revisado por el equipo de XUL.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">XUL</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
          {type === 'internal' ? 'Buzón de Sugerencias Interno' : 'Buzón de Sugerencias'}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          {type === 'internal'
            ? 'Comparte tus ideas o comentarios con el equipo de XUL'
            : 'Comparte tu opinión o sugerencia como cliente de XUL'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'internal' && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                id="anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-violet-600"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                Enviar de forma anónima
              </label>
            </div>
          )}

          {!isAnonymous && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'internal' ? 'Tu nombre' : 'Nombre (opcional)'}
                </label>
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Título breve de tu sugerencia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Describe tu sugerencia o comentario..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar sugerencia'}
          </button>
        </form>
      </div>
    </div>
  )
}
