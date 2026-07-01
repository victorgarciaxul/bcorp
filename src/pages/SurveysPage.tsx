import { useEffect, useState } from 'react'
import { sql } from '../lib/db'
import * as XLSX from 'xlsx'
import type { Survey, SurveyQuestion, SurveyResponse } from '../lib/database.types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { SURVEY_QUESTION_TEMPLATES } from '../lib/constants'
import { Plus, Send, BarChart2, Copy, CheckCircle, Download, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'

const STATUS_LABELS: Record<string, string> = { draft: 'Borrador', active: 'Activa', closed: 'Cerrada' }
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  active: 'bg-green-900/50 text-green-400',
  closed: 'bg-blue-900/50 text-blue-400',
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Survey | null>(null)

  const fetchSurveys = async () => {
    setLoading(true)
    const data = await sql`SELECT * FROM surveys ORDER BY created_at DESC`
    setSurveys(data as Survey[])
    setLoading(false)
  }

  useEffect(() => { fetchSurveys() }, [])

  const createSurvey = async (title: string, description: string) => {
    const [survey] = await sql`
      INSERT INTO surveys (title, description, year, status)
      VALUES (${title}, ${description || null}, ${new Date().getFullYear()}, 'draft')
      RETURNING *
    `
    if (survey) {
      for (const q of SURVEY_QUESTION_TEMPLATES) {
        await sql`
          INSERT INTO survey_questions (survey_id, question_text, question_type, category, order_index, is_required)
          VALUES (${(survey as Survey).id}, ${q.question_text}, ${q.question_type}, ${q.category ?? null}, ${q.order_index}, true)
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
          <p className="text-gray-500 text-sm mt-1">Gestiona y analiza las encuestas del equipo</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
          <Plus size={16} /> Nueva encuesta
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Cargando...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500">No hay encuestas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={STATUS_LABELS[survey.status]} className={STATUS_COLORS[survey.status]} />
                    <span className="text-xs text-gray-600">{survey.year}</span>
                  </div>
                  <h3 className="font-semibold text-gray-100">{survey.title}</h3>
                  {survey.description && <p className="text-sm text-gray-500 mt-0.5">{survey.description}</p>}
                  <p className="text-xs text-gray-600 mt-1">
                    Creada el {format(new Date(survey.created_at), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {survey.status === 'draft' && (
                    <button onClick={() => activateSurvey(survey.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-900/50">
                      <Send size={13} /> Activar
                    </button>
                  )}
                  {survey.status === 'active' && (
                    <>
                      <PublicLinkButton survey={survey} />
                      <button onClick={() => closeSurvey(survey.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-900/50">
                        Cerrar
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelected(survey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a4a] text-gray-400 border border-[#3a3a5a] rounded-lg text-sm hover:text-white hover:bg-[#3a3a5a]">
                    <BarChart2 size={13} /> Ver encuesta
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <CreateSurveyModal onClose={() => setCreating(false)} onCreate={createSurvey} />}
      {selected && <SurveyModal survey={selected} onClose={() => setSelected(null)} onRefresh={fetchSurveys} />}
    </div>
  )
}

function PublicLinkButton({ survey }: { survey: Survey }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/encuesta/${survey.id}`
  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-900/30 text-violet-400 border border-violet-500/30 rounded-lg text-sm hover:bg-violet-900/50">
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      {copied ? 'Copiado' : 'Copiar link'}
    </button>
  )
}

const QUESTION_TYPES: { value: string; label: string }[] = [
  { value: 'scale', label: 'Escala 1-5' },
  { value: 'scale_10', label: 'Escala 1-10 (eNPS)' },
  { value: 'text', label: 'Texto libre' },
  { value: 'yes_no', label: 'Sí / No' },
  { value: 'multi_select', label: 'Selección múltiple' },
  { value: 'custom_select', label: 'Selección única' },
]

function SurveyModal({ survey, onClose, onRefresh }: { survey: Survey; onClose: () => void; onRefresh: () => void }) {
  const [tab, setTab] = useState<'preguntas' | 'textos' | 'enviar' | 'resultados'>('preguntas')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [welcomeText, setWelcomeText] = useState(survey.welcome_text ?? '')
  const [closingText, setClosingText] = useState(survey.closing_text ?? '')
  const [savingTexts, setSavingTexts] = useState(false)
  const [textsSaved, setTextsSaved] = useState(false)
  const [editingQ, setEditingQ] = useState<SurveyQuestion | null>(null)
  const [addingQ, setAddingQ] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [radarData, setRadarData] = useState<{ category: string; avg: number }[]>([])
  const [barData, setBarData] = useState<{ name: string; avg: number; full: string }[]>([])
  const [textAnswers, setTextAnswers] = useState<{ question: string; answers: string[] }[]>([])
  const [openResponses, setOpenResponses] = useState<Record<string, boolean>>({})

  const loadQuestions = async () => {
    const qs = await sql`SELECT * FROM survey_questions WHERE survey_id = ${survey.id} ORDER BY order_index`
    setQuestions(qs as SurveyQuestion[])
  }

  useEffect(() => { loadQuestions() }, [survey.id])

  const deleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    await sql`DELETE FROM survey_questions WHERE id = ${id}`
    await loadQuestions()
  }

  const saveQuestion = async (data: Partial<SurveyQuestion> & { id?: string }) => {
    const maxIdx = questions.length > 0 ? Math.max(...questions.map(q => q.order_index)) : 0
    if (data.id) {
      try {
        await sql`
          UPDATE survey_questions SET
            question_text = ${data.question_text ?? ''},
            question_type = ${data.question_type ?? 'scale'},
            category = ${data.category ?? null},
            description = ${data.description ?? null},
            options = ${data.options ?? null},
            is_required = ${data.is_required ?? true}
          WHERE id = ${data.id}
        `
      } catch {
        await sql`
          UPDATE survey_questions SET
            question_text = ${data.question_text ?? ''},
            question_type = ${data.question_type ?? 'scale'},
            category = ${data.category ?? null},
            is_required = ${data.is_required ?? true}
          WHERE id = ${data.id}
        `
      }
    } else {
      try {
        await sql`
          INSERT INTO survey_questions (id, survey_id, question_text, question_type, category, description, options, is_required, order_index)
          VALUES (gen_random_uuid(), ${survey.id}, ${data.question_text ?? ''}, ${data.question_type ?? 'scale'}, ${data.category ?? null}, ${data.description ?? null}, ${data.options ?? null}, ${data.is_required ?? true}, ${maxIdx + 1})
        `
      } catch {
        await sql`
          INSERT INTO survey_questions (id, survey_id, question_text, question_type, category, is_required, order_index)
          VALUES (gen_random_uuid(), ${survey.id}, ${data.question_text ?? ''}, ${data.question_type ?? 'scale'}, ${data.category ?? null}, ${data.is_required ?? true}, ${maxIdx + 1})
        `
      }
    }
    await loadQuestions()
    setEditingQ(null)
    setAddingQ(false)
  }

  useEffect(() => {
    if (tab !== 'resultados') return
    const loadResults = async () => {
      setLoadingResults(true)
      const qs = await sql`SELECT * FROM survey_questions WHERE survey_id = ${survey.id} ORDER BY order_index`
      const rs = await sql`
        SELECT sr.*, COALESCE(json_agg(sa.*) FILTER (WHERE sa.id IS NOT NULL), '[]') AS survey_answers
        FROM survey_responses sr
        LEFT JOIN survey_answers sa ON sa.response_id = sr.id
        WHERE sr.survey_id = ${survey.id} AND sr.submitted_at IS NOT NULL
        GROUP BY sr.id
        ORDER BY sr.submitted_at DESC
      `
      setQuestions(qs as SurveyQuestion[])
      setResponses(rs as SurveyResponse[])

      const qsList = qs as SurveyQuestion[]
      const rsList = rs as Array<Record<string, unknown> & { survey_answers: Array<Record<string, unknown>> }>

      const catMap: Record<string, number[]> = {}
      for (const q of qsList.filter(q => q.question_type === 'scale')) {
        if (!catMap[q.category]) catMap[q.category] = []
        for (const r of rsList) {
          const ans = (r.survey_answers ?? []).find((a) => a.question_id === q.id)
          if (ans?.answer_scale) catMap[q.category].push(ans.answer_scale as number)
        }
      }
      setRadarData(Object.entries(catMap).map(([category, vals]) => ({
        category,
        avg: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
      })))

      setBarData(qsList.filter(q => q.question_type === 'scale').map(q => {
        const vals: number[] = []
        for (const r of rsList) {
          const ans = (r.survey_answers ?? []).find((a) => a.question_id === q.id)
          if (ans?.answer_scale) vals.push(ans.answer_scale as number)
        }
        return {
          name: q.question_text.length > 40 ? q.question_text.slice(0, 37) + '…' : q.question_text,
          full: q.question_text,
          avg: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
        }
      }))

      const textQs = qsList.filter(q => q.question_type === 'text')
      setTextAnswers(textQs.map(q => ({
        question: q.question_text,
        answers: rsList.flatMap(r =>
          (r.survey_answers ?? []).filter(a => a.question_id === q.id && a.answer_text).map(a => a.answer_text as string)
        ),
      })))

      setLoadingResults(false)
    }
    loadResults()
  }, [tab, survey.id])

  const saveTexts = async () => {
    setSavingTexts(true)
    setTextsSaved(false)
    try {
      await sql`UPDATE surveys SET welcome_text = ${welcomeText || null}, closing_text = ${closingText || null} WHERE id = ${survey.id}`
      setTextsSaved(true)
      onRefresh()
      setTimeout(() => setTextsSaved(false), 3000)
    } catch (e) {
      console.error('Error saving texts:', e)
    }
    setSavingTexts(false)
  }

  type RespRow = Record<string, unknown> & { survey_answers: Array<Record<string, unknown>> }
  const downloadExcel = () => {
    const rsList = (responses as unknown) as RespRow[]
    const rows = rsList.map((r, i) => {
      const row: Record<string, unknown> = {
        '#': i + 1,
        'Fecha': r.submitted_at ? format(new Date(r.submitted_at as string), 'dd/MM/yyyy HH:mm') : '',
        'Anónimo': r.is_anonymous ? 'Sí' : 'No',
      }
      for (const q of questions) {
        const ans = (r.survey_answers ?? []).find(a => a.question_id === q.id)
        row[q.question_text] = ans?.answer_scale ?? ans?.answer_text ?? ''
      }
      return row
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas')
    XLSX.writeFile(wb, `${survey.title.replace(/\s+/g, '_')}_resultados.xlsx`)
  }

  const tabs = [
    { key: 'preguntas', label: 'Preguntas' },
    { key: 'textos', label: 'Bienvenida · Cierre' },
    { key: 'enviar', label: 'Enviar' },
    { key: 'resultados', label: 'Resultados' },
  ] as const

  const tooltipStyle = { background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#fff', fontSize: 12 }

  return (
    <Modal open onClose={onClose} title={survey.title} size="xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#0f0f1a] rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Preguntas */}
      {tab === 'preguntas' && (
        <div className="space-y-2">
          {questions.length === 0 && !addingQ && (
            <p className="text-gray-500 text-sm text-center py-8">No hay preguntas</p>
          )}
          {questions.map((q, i) => (
            editingQ?.id === q.id ? (
              <QuestionEditor key={q.id} initial={q} onSave={saveQuestion} onCancel={() => setEditingQ(null)} />
            ) : (
              <div key={q.id} className="bg-[#0f0f1a] rounded-lg border border-[#2a2a4a] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-600 font-mono mt-0.5 w-5 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{q.question_text}</p>
                    {q.description && <p className="text-xs text-gray-500 mt-0.5">{q.description}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {q.category && <span className="text-xs bg-violet-900/30 text-violet-400 px-2 py-0.5 rounded">{q.category}</span>}
                      <span className="text-xs bg-[#2a2a4a] text-gray-400 px-2 py-0.5 rounded">{QUESTION_TYPES.find(t => t.value === q.question_type)?.label ?? q.question_type}</span>
                      {q.is_required && <span className="text-xs text-red-400">Obligatoria</span>}
                    </div>
                    <QuestionOptions q={q} />
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditingQ(q)}
                      className="p-1.5 text-gray-600 hover:text-violet-400 hover:bg-violet-900/20 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
          {addingQ && (
            <QuestionEditor onSave={saveQuestion} onCancel={() => setAddingQ(false)} />
          )}
          {!addingQ && !editingQ && (
            <button onClick={() => setAddingQ(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#3a3a5a] rounded-lg text-sm text-gray-500 hover:text-violet-400 hover:border-violet-500/50 transition-colors mt-2">
              <Plus size={14} /> Añadir pregunta
            </button>
          )}
        </div>
      )}

      {/* Tab: Bienvenida · Cierre */}
      {tab === 'textos' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Texto de bienvenida</label>
            <textarea value={welcomeText} onChange={e => setWelcomeText(e.target.value)} rows={6}
              placeholder="Texto que verá el participante antes de empezar..."
              className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Texto de cierre</label>
            <textarea value={closingText} onChange={e => setClosingText(e.target.value)} rows={4}
              placeholder="Mensaje de agradecimiento al enviar..."
              className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>
          <div className="flex justify-end items-center gap-3">
            {textsSaved && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={13} /> Guardado</span>}
            <button onClick={saveTexts} disabled={savingTexts}
              className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
              {savingTexts ? 'Guardando...' : 'Guardar textos'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Enviar */}
      {tab === 'enviar' && (
        <div className="space-y-5">
          <div className="bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl p-5">
            <p className="text-sm font-medium text-gray-300 mb-1">Link público de la encuesta</p>
            <p className="text-xs text-gray-500 mb-3">Comparte este enlace para que cualquier persona pueda responder</p>
            <div className="flex gap-2">
              <input readOnly value={`${window.location.origin}/encuesta/${survey.id}`}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-gray-400 font-mono" />
              <PublicLinkButton survey={survey} />
            </div>
          </div>

          {survey.status === 'draft' && (
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-400">
              La encuesta está en borrador. Actívala para que el link funcione.
            </div>
          )}

          <div className="bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl p-5">
            <p className="text-sm font-medium text-gray-300 mb-1">Tokens individuales</p>
            <p className="text-xs text-gray-500">
              Para enviar a personas concretas, crea tokens individuales en la base de datos (survey_responses) con is_anonymous = false.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Resultados */}
      {tab === 'resultados' && (
        loadingResults ? (
          <div className="text-center py-12 text-gray-500">Cargando resultados...</div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12">
            <BarChart2 size={36} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500">Todavía no hay respuestas enviadas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-violet-900/40 to-violet-800/20 border border-violet-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-violet-300">{responses.length}</div>
                <div className="text-xs text-violet-400 mt-1">Respuestas</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-cyan-300">
                  {radarData.length > 0 ? (radarData.reduce((a, b) => a + b.avg, 0) / radarData.length).toFixed(1) : '—'}
                </div>
                <div className="text-xs text-cyan-400 mt-1">Media general /5</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-300">{questions.length}</div>
                <div className="text-xs text-green-400 mt-1">Preguntas</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-900/30 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-900/50">
                <Download size={14} /> Descargar Excel
              </button>
            </div>

            {radarData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Media por categoría</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2a2a4a" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <Radar name="Media" dataKey="avg" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}/5`]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {barData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Media por pregunta</h3>
                <ResponsiveContainer width="100%" height={barData.length * 36 + 40}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2a2a4a" />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toFixed(1) + '/5']} />
                    <Bar dataKey="avg" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Media" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {textAnswers.filter(t => t.answers.length > 0).map(({ question, answers }) => (
              <div key={question}>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{question}</h3>
                <div className="space-y-2">
                  {answers.map((ans, i) => (
                    <div key={i} className="bg-[#0f0f1a] rounded-lg px-4 py-2.5 text-sm text-gray-400 border border-[#2a2a4a]">
                      "{ans}"
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Respuestas individuales */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Respuestas individuales</h3>
              <div className="space-y-2">
                {((responses as unknown) as RespRow[]).map((r, i) => (
                  <div key={r.id as string} className="bg-[#0f0f1a] rounded-xl border border-[#2a2a4a] overflow-hidden">
                    <button
                      onClick={() => setOpenResponses(prev => ({ ...prev, [r.id as string]: !prev[r.id as string] }))}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1a1a2e]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 font-mono">#{i + 1}</span>
                        <span className="text-xs text-gray-500">
                          {r.submitted_at ? format(new Date(r.submitted_at as string), 'dd MMM yyyy HH:mm', { locale: es }) : ''}
                        </span>
                        {!!r.is_anonymous && <span className="text-xs bg-[#2a2a4a] text-gray-500 px-2 py-0.5 rounded">Anónimo</span>}
                      </div>
                      {openResponses[r.id as string] ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
                    </button>
                    {openResponses[r.id as string] && (
                      <div className="px-4 pb-4 space-y-2 border-t border-[#2a2a4a]">
                        {questions.map(q => {
                          const ans = (r.survey_answers ?? []).find(a => a.question_id === q.id)
                          return (
                            <div key={q.id} className="flex gap-3 py-1.5">
                              <span className="text-xs text-gray-600 flex-shrink-0 w-4">{q.order_index}.</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">{q.question_text}</p>
                                <p className="text-sm text-gray-200 mt-0.5">
                                  {ans?.answer_scale != null ? `${ans.answer_scale}/5` : ans?.answer_text != null ? String(ans.answer_text) : <span className="text-gray-600 italic">Sin respuesta</span>}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </Modal>
  )
}

function QuestionOptions({ q }: { q: SurveyQuestion }) {
  if (q.question_type === 'scale') {
    return (
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map(v => (
          <div key={v} className="w-8 h-8 rounded-lg bg-[#2a2a4a] border border-[#3a3a5a] flex items-center justify-center text-xs text-gray-400">{v}</div>
        ))}
        <span className="self-center text-xs text-gray-600 ml-1">Escala 1-5</span>
      </div>
    )
  }
  if (q.question_type === 'scale_10') {
    return (
      <div className="flex gap-1 mt-2 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map(v => (
          <div key={v} className="w-7 h-7 rounded bg-[#2a2a4a] border border-[#3a3a5a] flex items-center justify-center text-xs text-gray-400">{v}</div>
        ))}
        <span className="self-center text-xs text-gray-600 ml-1">Escala 1-10</span>
      </div>
    )
  }
  if (q.question_type === 'yes_no') {
    return (
      <div className="flex gap-2 mt-2">
        {['Sí', 'No'].map(v => (
          <div key={v} className="px-4 py-1 rounded-lg bg-[#2a2a4a] border border-[#3a3a5a] text-xs text-gray-400">{v}</div>
        ))}
      </div>
    )
  }
  if ((q.question_type === 'multi_select' || q.question_type === 'custom_select') && q.options) {
    const opts = q.options.split('\n').filter(Boolean)
    return (
      <div className="mt-2 space-y-1">
        {opts.map(opt => (
          <div key={opt} className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-3 h-3 rounded${q.question_type === 'multi_select' ? '' : '-full'} bg-[#2a2a4a] border border-[#3a3a5a]`} />
            {opt}
          </div>
        ))}
      </div>
    )
  }
  if (q.question_type === 'text') {
    return <div className="mt-2 bg-[#2a2a4a] rounded-lg px-3 py-2 text-xs text-gray-600">Respuesta libre de texto</div>
  }
  return null
}

function QuestionEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: SurveyQuestion
  onSave: (data: Partial<SurveyQuestion> & { id?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [text, setText] = useState(initial?.question_text ?? '')
  const [type, setType] = useState<string>(initial?.question_type ?? 'scale')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [options, setOptions] = useState(initial?.options ?? '')
  const [isRequired, setIsRequired] = useState(initial?.is_required ?? true)
  const [saving, setSaving] = useState(false)

  const needsOptions = type === 'multi_select' || type === 'custom_select'

  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        id: initial?.id,
        question_text: text.trim(),
        question_type: type as SurveyQuestion['question_type'],
        category: category.trim() || null as unknown as string,
        description: description.trim() || null as unknown as string,
        options: needsOptions ? options.trim() || null as unknown as string : null as unknown as string,
        is_required: isRequired,
      })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    }
    setSaving(false)
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <div className="bg-[#0f0f1a] rounded-lg border border-violet-500/50 p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Texto de la pregunta *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
          placeholder="Escribe la pregunta..." className={inputCls + ' resize-none'} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls + ' appearance-none'}>
            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
          <input value={category} onChange={e => setCategory(e.target.value)}
            placeholder="Ej: Satisfacción, JEDI..." className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Descripción (opcional)</label>
        <input value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Texto de ayuda que aparece bajo la pregunta..." className={inputCls} />
      </div>
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Opciones (una por línea)</label>
          <textarea value={options} onChange={e => setOptions(e.target.value)} rows={4}
            placeholder="Opción 1&#10;Opción 2&#10;Opción 3" className={inputCls + ' resize-none font-mono text-xs'} />
        </div>
      )}
      {saveError && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{saveError}</p>}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)}
            className="w-3.5 h-3.5 accent-violet-600" />
          <span className="text-xs text-gray-400">Obligatoria</span>
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !text.trim()}
            className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-60">
            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Añadir pregunta'}
          </button>
        </div>
      </div>
    </div>
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Título *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Descripción (opcional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
        </div>
        <p className="text-xs text-gray-600 bg-[#0f0f1a] rounded-lg p-3 border border-[#2a2a4a]">
          Se crearán automáticamente las preguntas estándar alineadas con los criterios B Corp.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">Cancelar</button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
            {loading ? 'Creando...' : 'Crear encuesta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
