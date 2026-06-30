import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { sql } from '../../lib/db'
import type { Survey, SurveyQuestion } from '../../lib/database.types'

export default function SurveyFormPage() {
  const { token } = useParams<{ token: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responseId, setResponseId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!token) { setError('Enlace inválido.'); setLoading(false); return }

      let surveyId: string
      let respId: string

      // Try as individual response token first
      const byToken = await sql`SELECT id, survey_id, submitted_at FROM survey_responses WHERE token = ${token} LIMIT 1`

      if (byToken[0]) {
        if (byToken[0].submitted_at) { setSubmitted(true); setLoading(false); return }
        respId = byToken[0].id as string
        surveyId = byToken[0].survey_id as string
      } else {
        // Try as survey ID (public link) — create a new anonymous response
        const bySurveyId = await sql`SELECT id, status FROM surveys WHERE id = ${token} LIMIT 1`
        if (!bySurveyId[0]) { setError('Enlace no encontrado o expirado.'); setLoading(false); return }
        if (bySurveyId[0].status !== 'active') { setError('Esta encuesta no está activa.'); setLoading(false); return }

        const newResp = await sql`
          INSERT INTO survey_responses (id, survey_id, token, is_anonymous)
          VALUES (gen_random_uuid(), ${token}, gen_random_uuid()::text, true)
          RETURNING id, survey_id, submitted_at
        `
        if (!newResp[0]) { setError('Error al cargar la encuesta.'); setLoading(false); return }
        respId = newResp[0].id as string
        surveyId = newResp[0].survey_id as string
      }

      setResponseId(respId)

      const [surveyData, qs] = await Promise.all([
        sql`SELECT * FROM surveys WHERE id = ${surveyId} LIMIT 1`,
        sql`SELECT * FROM survey_questions WHERE survey_id = ${surveyId} ORDER BY order_index`,
      ])

      setSurvey(surveyData[0] as Survey)
      setQuestions(qs as SurveyQuestion[])
      setLoading(false)
    }
    load()
  }, [token])

  const setAnswer = (questionId: string, value: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const toggleMultiSelect = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[] | undefined) ?? []
    const next = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option]
    setAnswer(questionId, next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseId) return

    const missing = questions.filter(q => {
      if (!q.is_required) return false
      const ans = answers[q.id]
      if (ans === undefined || ans === null) return true
      if (typeof ans === 'string' && ans.trim() === '') return true
      if (Array.isArray(ans) && ans.length === 0) return true
      return false
    })
    if (missing.length > 0) {
      setError(`Por favor responde todas las preguntas obligatorias (${missing.length} pendientes).`)
      return
    }

    setSubmitting(true)
    setError('')

    for (const q of questions) {
      const ans = answers[q.id]
      if (ans === undefined || ans === null) continue
      let answerText: string | null = null
      let answerScale: number | null = null
      if (q.question_type === 'scale' || q.question_type === 'scale_10') {
        answerScale = typeof ans === 'number' ? ans : null
      } else if (q.question_type === 'multi_select') {
        answerText = Array.isArray(ans) ? ans.join(', ') : String(ans)
      } else {
        answerText = String(ans)
      }
      await sql`
        INSERT INTO survey_answers (response_id, question_id, answer_text, answer_scale)
        VALUES (${responseId}, ${q.id}, ${answerText}, ${answerScale})
      `
    }

    await sql`UPDATE survey_responses SET submitted_at = NOW() WHERE id = ${responseId}`

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !responseId) {
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
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
          <div className="bg-violet-600 px-8 py-6">
            <h1 className="text-xl font-bold text-white">{survey?.title}</h1>
          </div>
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">¡Gracias por tu participación!</h2>
            {survey?.closing_text ? (
              <p className="text-gray-600 text-sm whitespace-pre-wrap text-left">{survey.closing_text}</p>
            ) : (
              <p className="text-gray-500 text-sm">Tus respuestas han sido registradas. Tu opinión es muy valiosa para XUL.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!started && survey?.welcome_text) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full overflow-hidden">
          <div className="bg-violet-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{survey.title}</h1>
            {survey.description && <p className="text-violet-200 text-sm mt-2">{survey.description}</p>}
          </div>
          <div className="px-8 py-6">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
              {survey.welcome_text}
            </div>
            <button
              onClick={() => setStarted(true)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Comenzar encuesta
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-violet-600 px-8 py-6">
            <h1 className="text-xl font-bold text-white">{survey?.title}</h1>
            <p className="text-violet-200 text-xs mt-2">Tus respuestas son completamente confidenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="text-gray-400 font-normal mr-2">{i + 1}.</span>
                    {q.question_text}
                    {q.is_required && <span className="text-red-400 ml-1">*</span>}
                  </p>
                  {q.description && (
                    <p className="text-xs text-gray-500 mt-0.5 ml-5">{q.description}</p>
                  )}
                </div>

                {q.question_type === 'scale' && (
                  <div className="ml-5">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => setAnswer(q.id, v)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                            answers[q.id] === v
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md scale-105'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                          }`}>
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-xs text-gray-400">En desacuerdo</span>
                      <span className="text-xs text-gray-400">Muy de acuerdo</span>
                    </div>
                  </div>
                )}

                {q.question_type === 'scale_10' && (
                  <div className="ml-5">
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                        <button key={v} type="button" onClick={() => setAnswer(q.id, v)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${
                            answers[q.id] === v
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                              : v <= 6 ? 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:bg-red-50'
                              : v <= 8 ? 'bg-white text-gray-500 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:bg-green-50'
                          }`}>
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-xs text-gray-400">Muy improbable</span>
                      <span className="text-xs text-gray-400">100% probable</span>
                    </div>
                  </div>
                )}

                {q.question_type === 'text' && (
                  <textarea value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)}
                    rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-gray-700 placeholder-gray-400"
                    placeholder="Escribe tu respuesta aquí..." />
                )}

                {q.question_type === 'multi_select' && q.options && (
                  <div className="ml-5 space-y-2">
                    {q.options.split('\n').filter(Boolean).map(option => {
                      const sel = ((answers[q.id] as string[] | undefined) ?? []).includes(option)
                      return (
                        <label key={option} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={sel} onChange={() => toggleMultiSelect(q.id, option)} className="mt-0.5 w-4 h-4 accent-violet-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.question_type === 'custom_select' && q.options && (
                  <div className="ml-5 space-y-2">
                    {q.options.split('\n').filter(Boolean).map(option => {
                      const sel = answers[q.id] === option
                      return (
                        <label key={option} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'}`}>
                          <input type="radio" name={q.id} checked={sel} onChange={() => setAnswer(q.id, option)} className="mt-0.5 w-4 h-4 accent-violet-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.question_type === 'yes_no' && (
                  <div className="flex gap-3 ml-5">
                    {['Sí', 'No'].map(v => (
                      <button key={v} type="button" onClick={() => setAnswer(q.id, v)}
                        className={`px-8 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          answers[q.id] === v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <button type="submit" disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-60 shadow-sm">
                {submitting ? 'Enviando...' : 'Enviar respuestas'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">Tus respuestas son anónimas y confidenciales</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
