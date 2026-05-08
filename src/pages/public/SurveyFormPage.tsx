import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { SurveyQuestion } from '../../lib/database.types'

export default function SurveyFormPage() {
  const { token } = useParams<{ token: string }>()
  const [survey, setSurvey] = useState<{ id: string; title: string; description: string | null } | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responseId, setResponseId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!token) { setError('Enlace inválido.'); setLoading(false); return }

      const { data: response } = await supabase
        .from('survey_responses')
        .select('id, survey_id, submitted_at')
        .eq('token', token)
        .single()

      const resp = response as { id: string; survey_id: string; submitted_at: string | null }
      if (!resp) { setError('Enlace no encontrado o expirado.'); setLoading(false); return }
      if (resp.submitted_at) { setSubmitted(true); setLoading(false); return }

      setResponseId(resp.id)

      const [{ data: surveyData }, { data: qsRaw }] = await Promise.all([
        supabase.from('surveys').select('id, title, description').eq('id', resp.survey_id).single(),
        supabase.from('survey_questions').select('*').eq('survey_id', resp.survey_id).order('order_index'),
      ])

      setSurvey(surveyData as { id: string; title: string; description: string | null })
      setQuestions((qsRaw ?? []) as SurveyQuestion[])
      setLoading(false)
    }
    load()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseId) return
    setSubmitting(true)

    const answersToInsert = Object.entries(answers).map(([question_id, value]) => ({
      response_id: responseId,
      question_id,
      answer_scale: typeof value === 'number' ? value : null,
      answer_text: typeof value === 'string' ? value : null,
    }))

    await supabase.from('survey_answers').insert(answersToInsert as Record<string, unknown>[])
    await supabase.from('survey_responses').update({ submitted_at: new Date().toISOString() } as Record<string, unknown>).eq('id', responseId)

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Cargando encuesta...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Gracias por tu respuesta!</h2>
          <p className="text-gray-500 text-sm">Tus respuestas han sido registradas. Tu opinión es muy importante para XUL.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-violet-600 px-8 py-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white text-xs font-bold">XUL</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">{survey?.title}</h1>
            {survey?.description && <p className="text-violet-200 text-sm mt-1">{survey.description}</p>}
            <p className="text-violet-200 text-xs mt-2">Tu participación es opcional y confidencial. Escala: 1 (muy mal) — 5 (excelente)</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  <span className="text-gray-400 mr-2">{i + 1}.</span>{q.question_text}
                  <span className="ml-2 text-xs text-gray-400 font-normal">({q.category})</span>
                </label>

                {q.question_type === 'scale' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                          answers[q.id] === v
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

                {q.question_type === 'text' && (
                  <textarea
                    value={(answers[q.id] as string) ?? ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    placeholder="Tu respuesta (opcional)..."
                  />
                )}

                {q.question_type === 'yes_no' && (
                  <div className="flex gap-3">
                    {['Sí', 'No'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                        className={`px-6 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          answers[q.id] === v
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? 'Enviando...' : 'Enviar respuestas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
