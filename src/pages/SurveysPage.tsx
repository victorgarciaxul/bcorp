import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemoMode } from '../lib/demo'
import { mockSurveys, mockSurveyQuestions, mockSurveyAnswers } from '../lib/mockData'
import type { Survey, SurveyQuestion, SurveyResponse } from '../lib/database.types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { SURVEY_QUESTION_TEMPLATES } from '../lib/constants'
import { Plus, Send, BarChart2, ChevronRight, Copy, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'

const STATUS_LABELS = { draft: 'Borrador', active: 'Activa', closed: 'Cerrada' }
const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', closed: 'bg-blue-100 text-blue-700' }

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Survey | null>(null)
  const [view, setView] = useState<'list' | 'results'>('list')

  const fetchSurveys = async () => {
    setLoading(true)
    if (isDemoMode()) {
      setSurveys(mockSurveys)
      setLoading(false)
      return
    }
    const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false })
    setSurveys((data ?? []) as Survey[])
    setLoading(false)
  }

  useEffect(() => { fetchSurveys() }, [])

  const createSurvey = async (title: string, description: string) => {
    const { data: surveyRaw } = await supabase
      .from('surveys')
      .insert([{ title, description, year: new Date().getFullYear(), status: 'draft' }] as Record<string, unknown>[])
      .select()
      .single()

    const survey = surveyRaw as Survey | null
    if (survey) {
      await supabase.from('survey_questions').insert(
        SURVEY_QUESTION_TEMPLATES.map(q => ({ ...q, survey_id: survey.id })) as Record<string, unknown>[]
      )
    }
    await fetchSurveys()
    setCreating(false)
  }

  const activateSurvey = async (id: string) => {
    await supabase.from('surveys').update({ status: 'active' } as Record<string, unknown>).eq('id', id)
    await fetchSurveys()
  }

  const closeSurvey = async (id: string) => {
    await supabase.from('surveys').update({ status: 'closed' } as Record<string, unknown>).eq('id', id)
    await fetchSurveys()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encuestas de Satisfacción</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona y analiza las encuestas del equipo</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Nueva encuesta
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No hay encuestas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={STATUS_LABELS[survey.status]} className={STATUS_COLORS[survey.status]} />
                    <span className="text-xs text-gray-400">{survey.year}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{survey.title}</h3>
                  {survey.description && <p className="text-sm text-gray-500 mt-0.5">{survey.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Creada el {format(new Date(survey.created_at), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {survey.status === 'draft' && (
                    <button
                      onClick={() => activateSurvey(survey.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100"
                    >
                      <Send size={13} /> Activar
                    </button>
                  )}
                  {survey.status === 'active' && (
                    <>
                      <SurveyLinkButton surveyId={survey.id} />
                      <button
                        onClick={() => closeSurvey(survey.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm hover:bg-blue-100"
                      >
                        Cerrar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelected(survey); setView('results') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-100"
                  >
                    <BarChart2 size={13} /> Resultados
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateSurveyModal onClose={() => setCreating(false)} onCreate={createSurvey} />
      )}

      {selected && view === 'results' && (
        <SurveyResultsModal survey={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function SurveyLinkButton({ surveyId }: { surveyId: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/encuesta/${surveyId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-sm hover:bg-violet-100"
    >
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      {copied ? 'Copiado' : 'Copiar link'}
    </button>
  )
}

function CreateSurveyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, description: string) => Promise<void> }) {
  const [title, setTitle] = useState(`Encuesta de Satisfacción ${new Date().getFullYear()}`)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate(title, description)
    setLoading(false)
  }

  return (
    <Modal open onClose={onClose} title="Nueva encuesta" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          Se crearán automáticamente 9 preguntas estándar alineadas con los criterios B Corp (Satisfacción, Bienestar, Pertenencia, Compromiso, Seguridad psicológica, JEDI).
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
            {loading ? 'Creando...' : 'Crear encuesta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SurveyResultsModal({ survey, onClose }: { survey: Survey; onClose: () => void }) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [radarData, setRadarData] = useState<{ category: string; avg: number }[]>([])
  const [barData, setBarData] = useState<{ name: string; avg: number; full: string }[]>([])
  const [textAnswers, setTextAnswers] = useState<{ question: string; answers: string[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (isDemoMode()) {
        const mockData = mockSurveyAnswers[survey.id as keyof typeof mockSurveyAnswers]
        setQuestions(mockSurveyQuestions.filter(q => q.survey_id === survey.id))
        setResponses([])
        if (mockData) {
          setRadarData(mockData.radarData)
          setBarData(mockData.barData)
          setTextAnswers(mockData.textAnswers)
        }
        setLoading(false)
        return
      }

      const [{ data: qsRaw }, { data: rsRaw }] = await Promise.all([
        supabase.from('survey_questions').select('*').eq('survey_id', survey.id).order('order_index'),
        supabase.from('survey_responses').select('*, survey_answers(*)').eq('survey_id', survey.id).not('submitted_at', 'is', null),
      ])

      const qs = (qsRaw ?? []) as SurveyQuestion[]
      const rs = (rsRaw ?? []) as any[]

      setQuestions(qs)
      setResponses(rs as SurveyResponse[])

      if (qs.length === 0) { setLoading(false); return }

      // Radar by category
      const catMap: Record<string, number[]> = {}
      for (const q of qs.filter((q: SurveyQuestion) => q.question_type === 'scale')) {
        if (!catMap[q.category]) catMap[q.category] = []
        for (const r of rs as any[]) {
          const ans = r.survey_answers?.find((a: any) => a.question_id === q.id)
          if (ans?.answer_scale) catMap[q.category].push(ans.answer_scale)
        }
      }
      setRadarData(Object.entries(catMap).map(([category, vals]) => ({
        category,
        avg: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
      })))

      // Bar per question
      const bar = qs.filter((q: SurveyQuestion) => q.question_type === 'scale').map((q: SurveyQuestion) => {
        const vals: number[] = []
        for (const r of rs as any[]) {
          const ans = r.survey_answers?.find((a: any) => a.question_id === q.id)
          if (ans?.answer_scale) vals.push(ans.answer_scale)
        }
        return {
          name: q.question_text.length > 40 ? q.question_text.slice(0, 37) + '…' : q.question_text,
          full: q.question_text,
          avg: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
        }
      })
      setBarData(bar)

      // Text answers
      const textQs = qs.filter((q: SurveyQuestion) => q.question_type === 'text')
      const textResults = textQs.map(q => ({
        question: q.question_text,
        answers: (rs as any[]).flatMap(r =>
          (r.survey_answers ?? []).filter((a: any) => a.question_id === q.id && a.answer_text).map((a: any) => a.answer_text)
        ),
      }))
      setTextAnswers(textResults)

      setLoading(false)
    }
    load()
  }, [survey.id])

  const mockData = isDemoMode() ? mockSurveyAnswers[survey.id as keyof typeof mockSurveyAnswers] : null
  const total = mockData ? mockData.totalResponses : responses.length

  return (
    <Modal open onClose={onClose} title={`Resultados — ${survey.title}`} size="xl">
      {loading ? (
        <div className="text-center py-8 text-gray-400">Cargando resultados...</div>
      ) : total === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Todavía no hay respuestas enviadas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-violet-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-violet-700">{total}</div>
              <div className="text-sm text-violet-600 mt-1">Respuestas recibidas</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {radarData.length > 0 ? (radarData.reduce((a, b) => a + b.avg, 0) / radarData.length).toFixed(1) : '—'}
              </div>
              <div className="text-sm text-blue-600 mt-1">Media general (sobre 5)</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{questions.length}</div>
              <div className="text-sm text-green-600 mt-1">Preguntas</div>
            </div>
          </div>

          {radarData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Media por categoría</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar name="Media" dataKey="avg" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
                  <Tooltip formatter={(v) => [`${Number(v)}/5`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {barData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Media por pregunta</h3>
              <ResponsiveContainer width="100%" height={barData.length * 36 + 40}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, _name, props: any) => [Number(v).toFixed(1) + '/5', props?.payload?.full ?? '']} />
                  <Legend />
                  <Bar dataKey="avg" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Media" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {textAnswers.filter(t => t.answers.length > 0).map(({ question, answers }) => (
            <div key={question}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{question}</h3>
              <div className="space-y-2">
                {answers.map((ans, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700">
                    "{ans}"
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
