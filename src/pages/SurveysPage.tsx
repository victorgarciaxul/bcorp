import { useEffect, useState } from 'react'
import { sql } from '../lib/db'
import type { Survey, SurveyQuestion } from '../lib/database.types'
import { mockSurveys } from '../lib/mockData'
import { SURVEY_QUESTION_TEMPLATES } from '../lib/constants'
import { Plus, Send, BarChart2, Copy, CheckCircle, X, ChevronDown, ChevronUp, Trash2, Download, Link } from 'lucide-react'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'

const STATUS_LABELS = { draft: 'Borrador', active: 'Activa', closed: 'Cerrada' }
const STATUS_DOT = { draft: 'bg-gray-400', active: 'bg-emerald-400', closed: 'bg-blue-400' }

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Survey | null>(null)

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const data = await sql`SELECT * FROM surveys ORDER BY created_at DESC`
      setSurveys(data as Survey[])
    } catch {
      setSurveys(mockSurveys)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSurveys() }, [])

  const createSurvey = async (title: string, description: string) => {
    const [survey] = await sql`
      INSERT INTO surveys (id, title, description, year, status)
      VALUES (gen_random_uuid(), ${title}, ${description || null}, ${new Date().getFullYear()}, 'draft')
      RETURNING *
    `
    if (survey) {
      for (const q of SURVEY_QUESTION_TEMPLATES) {
        await sql`
          INSERT INTO survey_questions (id, survey_id, question_text, question_type, category, order_index)
          VALUES (gen_random_uuid(), ${survey.id}, ${q.question_text}, ${q.question_type}, ${q.category}, ${q.order_index})
        `
      }
    }
    await fetchSurveys()
    setCreating(false)
  }

  const activateSurvey = async (id: string) => {
    await sql`UPDATE surveys SET status = 'active' WHERE id = ${id}`
    await fetchSurveys()
  }

  const closeSurvey = async (id: string) => {
    await sql`UPDATE surveys SET status = 'closed' WHERE id = ${id}`
    await fetchSurveys()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Encuestas de Satisfacción</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona y analiza las encuestas del equipo</p>
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
        <div className="text-center py-16 text-gray-500">Cargando...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500">No hay encuestas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[survey.status]}`} />
                    <span className="text-xs text-gray-400">{STATUS_LABELS[survey.status]}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{survey.year}</span>
                  </div>
                  <h3 className="font-semibold text-white">{survey.title}</h3>
                  {survey.description && <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{survey.description}</p>}
                  <p className="text-xs text-gray-600 mt-1">
                    Creada el {format(new Date(survey.created_at), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {survey.status === 'draft' && (
                    <button
                      onClick={() => activateSurvey(survey.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
                    >
                      <Send size={13} /> Activar
                    </button>
                  )}
                  {survey.status === 'active' && (
                    <>
                      <PublicLinkButton surveyId={survey.id} />
                      <SurveyLinkButton surveyId={survey.id} />
                      <button
                        onClick={() => closeSurvey(survey.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm hover:bg-blue-500/20 transition-colors"
                      >
                        Cerrar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelected(survey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-sm hover:bg-violet-500/20 transition-colors"
                  >
                    <BarChart2 size={13} /> Ver encuesta
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

      {selected && (
        <SurveyModal survey={selected} onClose={() => { setSelected(null); fetchSurveys() }} />
      )}
    </div>
  )
}

function PublicLinkButton({ surveyId }: { surveyId: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/encuesta/${surveyId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
      title="Link público — cualquiera puede responder"
    >
      {copied ? <CheckCircle size={13} /> : <Link size={13} />}
      {copied ? 'Copiado' : 'Link público'}
    </button>
  )
}

function SurveyLinkButton({ surveyId }: { surveyId: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/encuesta/${surveyId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-sm hover:bg-violet-500/20 transition-colors"
    >
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      {copied ? 'Copiado' : 'Copiar link'}
    </button>
  )
}

// ─── MAIN SURVEY MODAL ────────────────────────────────────────────────────────

type MainTab = 'preguntas' | 'bienvenida' | 'enviar' | 'resultados'

function SurveyModal({ survey, onClose }: { survey: Survey; onClose: () => void }) {
  const [tab, setTab] = useState<MainTab>('resultados')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const TABS: { key: MainTab; label: string }[] = [
    { key: 'preguntas', label: 'Preguntas' },
    { key: 'bienvenida', label: 'Bienvenida / Cierre' },
    { key: 'enviar', label: 'Enviar' },
    { key: 'resultados', label: 'Resultados' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#12121f] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-[#2a2a4a]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
          <h2 className="text-base font-semibold text-white">{survey.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#1e1e35] text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {tab === 'preguntas' && <TabPreguntas surveyId={survey.id} />}
          {tab === 'bienvenida' && <TabBienvenida survey={survey} />}
          {tab === 'enviar' && <TabEnviar survey={survey} />}
          {tab === 'resultados' && <TabResultados survey={survey} />}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: PREGUNTAS ──────────────────────────────────────────────────────────

function QuestionOptions({ q }: { q: SurveyQuestion }) {
  if (q.question_type === 'scale') {
    return (
      <div className="flex gap-1.5 mt-2 ml-9">
        {[1,2,3,4,5].map(n => (
          <div key={n} className="w-8 h-8 rounded-lg bg-[#12121f] border border-[#2a2a4a] flex items-center justify-center text-xs text-gray-400">{n}</div>
        ))}
        <div className="flex items-center gap-2 ml-2 text-xs text-gray-600">
          <span>Muy en desacuerdo</span><span>→</span><span>Muy de acuerdo</span>
        </div>
      </div>
    )
  }
  if (q.question_type === 'scale_10') {
    return (
      <div className="flex gap-1 mt-2 ml-9 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs border ${
            n <= 4 ? 'bg-red-900/20 border-red-500/30 text-red-400' :
            n <= 7 ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                     'bg-green-900/20 border-green-500/30 text-green-400'
          }`}>{n}</div>
        ))}
      </div>
    )
  }
  if (q.question_type === 'yes_no') {
    return (
      <div className="flex gap-2 mt-2 ml-9">
        <div className="px-4 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-500/30 text-xs text-emerald-400">Sí</div>
        <div className="px-4 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30 text-xs text-red-400">No</div>
      </div>
    )
  }
  if ((q.question_type === 'multi_select' || q.question_type === 'custom_select') && q.options) {
    const opts = q.options.split('\n').filter(Boolean)
    return (
      <div className="mt-2 ml-9 space-y-1">
        {opts.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border border-[#3a3a5a] bg-[#12121f] ${q.question_type === 'custom_select' ? 'rounded-full' : ''}`} />
            {opt}
          </div>
        ))}
      </div>
    )
  }
  if (q.question_type === 'text') {
    return (
      <div className="mt-2 ml-9">
        <div className="bg-[#12121f] border border-[#2a2a4a] rounded-lg px-3 py-2 text-xs text-gray-600 italic">Respuesta de texto libre...</div>
      </div>
    )
  }
  return null
}

function TabPreguntas({ surveyId }: { surveyId: string }) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sql`SELECT * FROM survey_questions WHERE survey_id = ${surveyId} ORDER BY order_index`
      .then(data => { setQuestions(data as SurveyQuestion[]); setLoading(false) })
  }, [surveyId])

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-violet-400 text-sm font-bold mt-0.5 w-6 flex-shrink-0">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{q.question_text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 bg-[#2a2a4a] px-2 py-0.5 rounded">{q.category}</span>
              </div>
            </div>
          </div>
          <QuestionOptions q={q} />
        </div>
      ))}
    </div>
  )
}

// ─── TAB: BIENVENIDA / CIERRE ────────────────────────────────────────────────

function TabBienvenida({ survey }: { survey: Survey }) {
  const [welcomeText, setWelcomeText] = useState(survey.welcome_text ?? '')
  const [closingText, setClosingText] = useState(survey.closing_text ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await sql`UPDATE surveys SET welcome_text = ${welcomeText || null}, closing_text = ${closingText || null} WHERE id = ${survey.id}`
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Texto de bienvenida</label>
        <textarea
          value={welcomeText}
          onChange={e => setWelcomeText(e.target.value)}
          rows={8}
          className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          placeholder="Texto que verán los empleados antes de empezar..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Texto de cierre</label>
        <textarea
          value={closingText}
          onChange={e => setClosingText(e.target.value)}
          rows={4}
          className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          placeholder="Mensaje de agradecimiento tras enviar la encuesta..."
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
        >
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── TAB: ENVIAR ─────────────────────────────────────────────────────────────

function TabEnviar({ survey }: { survey: Survey }) {
  const [emails, setEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [responses, setResponses] = useState<{ id: string; token: string; employee_email: string | null; submitted_at: string | null }[]>([])

  useEffect(() => {
    sql`SELECT id, token, employee_email, submitted_at FROM survey_responses WHERE survey_id = ${survey.id} ORDER BY submitted_at DESC NULLS LAST`
      .then(data => setResponses(data as typeof responses))
  }, [survey.id])

  const handleSend = async () => {
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
    if (list.length === 0) return
    setSending(true)
    const newLinks: string[] = []
    for (const email of list) {
      const [row] = await sql`
        INSERT INTO survey_responses (id, survey_id, token, employee_email, is_anonymous)
        VALUES (gen_random_uuid(), ${survey.id}, gen_random_uuid()::text, ${email}, false)
        ON CONFLICT DO NOTHING
        RETURNING token
      `
      if (row) newLinks.push(`${window.location.origin}/encuesta/${row.token}`)
    }
    setSent(newLinks)
    setSending(false)
    setEmails('')
    const data = await sql`SELECT id, token, employee_email, submitted_at FROM survey_responses WHERE survey_id = ${survey.id} ORDER BY submitted_at DESC NULLS LAST`
    setResponses(data as typeof responses)
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/encuesta/${token}`)
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-4">
        <p className="text-sm font-medium text-gray-300 mb-2">Generar links por email</p>
        <textarea
          value={emails}
          onChange={e => setEmails(e.target.value)}
          rows={3}
          className="w-full bg-[#12121f] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          placeholder="nombre@empresa.com, otro@empresa.com..."
        />
        <button
          onClick={handleSend}
          disabled={sending || !emails.trim()}
          className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {sending ? 'Generando...' : 'Generar links'}
        </button>
        {sent.length > 0 && (
          <div className="mt-3 space-y-1">
            {sent.map(link => (
              <div key={link} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                <span className="text-xs text-emerald-400 flex-1 truncate">{link}</span>
                <button onClick={() => navigator.clipboard.writeText(link)} className="text-emerald-400 hover:text-emerald-300">
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Links generados ({responses.length})</p>
        <div className="space-y-2">
          {responses.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.employee_email || 'Anónimo'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.submitted_at
                    ? `Enviado el ${format(new Date(r.submitted_at), 'dd MMM yyyy HH:mm', { locale: es })}`
                    : 'Pendiente'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.submitted_at ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                {r.submitted_at ? 'Completado' : 'Sin responder'}
              </span>
              <button
                onClick={() => copyLink(r.token)}
                className="text-gray-500 hover:text-violet-400 transition-colors"
                title="Copiar link"
              >
                <Copy size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: RESULTADOS ─────────────────────────────────────────────────────────

type ResponseRow = { id: string; submitted_at: string; employee_email: string | null; is_anonymous: boolean }
type AnswerRow = { response_id: string; question_id: string; answer_scale: number | null; answer_text: string | null }

function TabResultados({ survey }: { survey: Survey }) {
  const [subTab, setSubTab] = useState<'resumen' | 'individuales'>('individuales')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responsesList, setResponsesList] = useState<ResponseRow[]>([])
  const [allAnswers, setAllAnswers] = useState<AnswerRow[]>([])
  const [radarData, setRadarData] = useState<{ category: string; avg: number }[]>([])
  const [barData, setBarData] = useState<{ name: string; avg: number; full: string; max: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [qs, answers, resps] = await Promise.all([
        sql`SELECT * FROM survey_questions WHERE survey_id = ${survey.id} ORDER BY order_index`,
        sql`SELECT sa.response_id, sa.question_id, sa.answer_scale, sa.answer_text
            FROM survey_answers sa
            JOIN survey_responses sr ON sr.id = sa.response_id
            WHERE sr.survey_id = ${survey.id} AND sr.submitted_at IS NOT NULL`,
        sql`SELECT id, submitted_at, employee_email, is_anonymous
            FROM survey_responses WHERE survey_id = ${survey.id} AND submitted_at IS NOT NULL
            ORDER BY submitted_at`,
      ])
      setQuestions(qs as SurveyQuestion[])
      setAllAnswers(answers as AnswerRow[])
      setResponsesList(resps as ResponseRow[])

      const catMap: Record<string, number[]> = {}
      for (const q of (qs as SurveyQuestion[]).filter(q => q.question_type === 'scale' || q.question_type === 'scale_10')) {
        if (!catMap[q.category]) catMap[q.category] = []
        const vals = (answers as AnswerRow[]).filter(a => a.question_id === q.id && a.answer_scale)
          .map(a => q.question_type === 'scale_10' ? (a.answer_scale! / 10) * 5 : a.answer_scale!)
        catMap[q.category].push(...vals)
      }
      setRadarData(Object.entries(catMap).map(([category, vals]) => ({
        category,
        avg: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
      })))

      setBarData((qs as SurveyQuestion[]).filter(q => q.question_type === 'scale' || q.question_type === 'scale_10').map(q => {
        const vals = (answers as AnswerRow[]).filter(a => a.question_id === q.id && a.answer_scale).map(a => a.answer_scale!)
        return {
          name: q.question_text.length > 45 ? q.question_text.slice(0, 42) + '…' : q.question_text,
          full: q.question_text,
          avg: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
          max: q.question_type === 'scale_10' ? 10 : 5,
        }
      }))

      setLoading(false)
    }
    load()
  }, [survey.id])

  const deleteResponse = async (id: string) => {
    await sql`DELETE FROM survey_responses WHERE id = ${id}`
    setResponsesList(prev => prev.filter(r => r.id !== id))
    setAllAnswers(prev => prev.filter(a => a.response_id !== id))
  }

  const total = responsesList.length
  const generalAvg = radarData.length > 0
    ? (radarData.reduce((a, b) => a + b.avg, 0) / radarData.length).toFixed(1)
    : '0.0'

  const downloadExcel = () => {
    const rows: Record<string, string>[] = []

    for (const resp of responsesList) {
      const respAnswers = allAnswers.filter(a => a.response_id === resp.id)
      const row: Record<string, string> = {
        'Respondido': format(new Date(resp.submitted_at), 'dd/MM/yyyy HH:mm', { locale: es }),
        'Nombre / Email': resp.employee_email || (resp.is_anonymous ? 'Anónimo' : ''),
      }
      for (const q of questions) {
        const ans = respAnswers.find(a => a.question_id === q.id)
        let value = ''
        if (ans?.answer_scale != null) value = String(ans.answer_scale)
        else if (ans?.answer_text) value = ans.answer_text
        row[`${q.order_index + 1}. ${q.question_text}`] = value
      }
      rows.push(row)
    }

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados')
    XLSX.writeFile(wb, `${survey.title.replace(/\s+/g, '_')}_resultados.xlsx`)
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando resultados...</div>

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #2d1b6e 0%, #1a0f4e 100%)' }}>
          <div className="text-4xl font-bold text-violet-300">{total}</div>
          <div className="text-sm text-violet-400 mt-1">Respuestas</div>
        </div>
        <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #0f2a4a 0%, #0a1a30 100%)' }}>
          <div className="text-4xl font-bold text-cyan-300">{generalAvg}</div>
          <div className="text-sm text-cyan-400 mt-1">Media global</div>
        </div>
        <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #0f3a2a 0%, #082a1e 100%)' }}>
          <div className="text-4xl font-bold text-emerald-300">{questions.length}</div>
          <div className="text-sm text-emerald-400 mt-1">Preguntas</div>
        </div>
      </div>

      {/* Sub-tabs + download */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-1 bg-[#1a1a2e] rounded-lg p-1 flex-1">
          <button
            onClick={() => setSubTab('resumen')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              subTab === 'resumen' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setSubTab('individuales')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              subTab === 'individuales' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Respuestas Individuales ({total})
          </button>
        </div>
        {total > 0 && (
          <button
            onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors flex-shrink-0"
            title="Descargar resultados en Excel"
          >
            <Download size={14} /> Excel
          </button>
        )}
      </div>

      {/* Resumen */}
      {subTab === 'resumen' && total > 0 && (
        <div className="space-y-6">
          {radarData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Media por categoría</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a2a4a" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Radar name="Media" dataKey="avg" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#fff' }}
                    formatter={(v) => [`${Number(v)}/5`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          {barData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Media por pregunta</p>
              <ResponsiveContainer width="100%" height={barData.length * 36 + 40}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2a2a4a" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#fff' }}
                    formatter={(v, _n, p: any) => [`${Number(v).toFixed(1)}/${p?.payload?.max ?? 5}`, p?.payload?.full ?? '']}
                  />
                  <Bar dataKey="avg" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Respuestas individuales */}
      {subTab === 'individuales' && (
        <div className="space-y-2">
          {total === 0 && <p className="text-center text-gray-500 py-8">Todavía no hay respuestas.</p>}
          {responsesList.map((resp, i) => {
            const respAnswers = allAnswers.filter(a => a.response_id === resp.id)
            const isOpen = expanded === resp.id
            return (
              <div key={resp.id} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl overflow-hidden">
                {/* Response header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1e1e35] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : resp.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {resp.employee_email || (resp.is_anonymous ? 'Anónimo' : `Respuesta ${i + 1}`)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(resp.submitted_at), "dd MMM yyyy · HH:mm", { locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteResponse(resp.id) }}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    title="Eliminar respuesta"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>

                {/* Questions accordion */}
                {isOpen && (
                  <div className="border-t border-[#2a2a4a] divide-y divide-[#1e1e35]">
                    {questions.map((q, qi) => {
                      const ans = respAnswers.find(a => a.question_id === q.id)
                      const hasAnswer = ans && (ans.answer_scale != null || (ans.answer_text && ans.answer_text.trim()))
                      const value = ans?.answer_scale != null
                        ? `${ans.answer_scale} / ${q.question_type === 'scale_10' ? 10 : 5}`
                        : ans?.answer_text || null
                      return (
                        <div key={q.id} className="px-4 py-3">
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-600 mr-2">{qi + 1}.</span>
                            {q.question_text}
                          </p>
                          {hasAnswer ? (
                            ans?.answer_scale != null ? (
                              <div className="flex items-center gap-3 mt-2 ml-5">
                                <div className="flex-1 bg-[#12121f] rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full bg-violet-500"
                                    style={{ width: `${(ans.answer_scale / (q.question_type === 'scale_10' ? 10 : 5)) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-violet-400 w-12 text-right">{value}</span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-300 mt-1 ml-5 bg-[#12121f] rounded-lg px-3 py-2">{value}</p>
                            )
                          ) : (
                            <p className="text-sm text-amber-500/70 mt-1 ml-5">Sin respuesta</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────

function CreateSurveyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, description: string) => Promise<void> }) {
  const [title, setTitle] = useState(`Encuesta de Satisfacción ${new Date().getFullYear()}`)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate(title, description)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#12121f] rounded-xl shadow-2xl w-full max-w-md border border-[#2a2a4a]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
          <h2 className="text-base font-semibold text-white">Nueva encuesta</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear encuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
