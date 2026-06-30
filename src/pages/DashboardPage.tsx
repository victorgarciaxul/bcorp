import { useEffect, useState } from 'react'
import { sql } from '../lib/db'
import type { PlanItem } from '../lib/database.types'
import { CATEGORY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import Badge from '../components/ui/Badge'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { AlertCircle, ClipboardList, MessageSquare, BarChart2 } from 'lucide-react'
import { format, isAfter, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

const CHART_COLORS = ['#374151', '#3b82f6', '#eab308', '#22c55e']
const STATUS_ORDER = ['no_iniciado', 'trabajando', 'pdt_revision', 'finalizado']

export default function DashboardPage() {
  const [items, setItems] = useState<PlanItem[]>([])
  const [suggestionCount, setSuggestionCount] = useState(0)
  const [newSuggestions, setNewSuggestions] = useState(0)
  const [surveyCount, setSurveyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [planData, sugs, surveys] = await Promise.all([
        sql`SELECT * FROM plan_items WHERE year = 2026 ORDER BY category`,
        sql`SELECT id, status FROM suggestions`,
        sql`SELECT id FROM surveys`,
      ])
      setItems(planData as PlanItem[])
      setSuggestionCount(sugs.length)
      setNewSuggestions(sugs.filter((s: Record<string, unknown>) => s.status === 'new').length)
      setSurveyCount(surveys.length)
      setLoading(false)
    }
    load()
  }, [])

  const total = items.length
  const done = items.filter(i => i.status === 'finalizado').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const statusCounts = STATUS_ORDER.map(status => ({
    name: STATUS_LABELS[status],
    value: items.filter(i => i.status === status).length,
  }))

  const categoryCounts = Object.entries(
    items.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([category, total]) => ({
    category: category.split(' ')[0],
    fullCategory: category,
    total,
    done: items.filter(i => i.category === category && i.status === 'finalizado').length,
  }))

  const responsibleCounts = Object.entries(
    items.reduce((acc, i) => {
      const people = (i.responsible ?? '').split(',').map(p => p.trim()).filter(Boolean)
      for (const p of people) {
        const key = p.split(' ')[0]
        if (!acc[key]) acc[key] = { total: 0, done: 0 }
        acc[key].total++
        if (i.status === 'finalizado') acc[key].done++
      }
      return acc
    }, {} as Record<string, { total: number; done: number }>)
  )
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([name, counts]) => ({ name, ...counts }))

  const upcoming = items
    .filter(i => i.deadline && i.status !== 'finalizado')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)

  const tooltipStyle = { background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#fff', fontSize: 12 }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Dashboard B Corp 2026</h1>
        <p className="text-gray-500 text-sm mt-1">Estado general de la certificación</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Progreso general</p>
              <p className="text-3xl font-bold text-white mt-1">{pct}%</p>
              <p className="text-xs text-gray-600 mt-1">{done} de {total} ítems</p>
            </div>
            <ClipboardList size={20} className="text-violet-500 mt-1" />
          </div>
          <div className="mt-3 bg-[#2a2a4a] rounded-full h-1.5">
            <div className="bg-violet-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <p className="text-sm text-gray-500">Finalizados</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{done}</p>
          <p className="text-xs text-gray-600 mt-1">de {total} ítems B Corp</p>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Sugerencias</p>
              <p className="text-3xl font-bold text-white mt-1">{suggestionCount}</p>
              {newSuggestions > 0 && (
                <p className="text-xs text-red-400 mt-1">{newSuggestions} sin leer</p>
              )}
            </div>
            <MessageSquare size={20} className="text-blue-500 mt-1" />
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Encuestas</p>
              <p className="text-3xl font-bold text-white mt-1">{surveyCount}</p>
              <p className="text-xs text-gray-600 mt-1">lanzadas este año</p>
            </div>
            <BarChart2 size={20} className="text-orange-500 mt-1" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Por estado</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                {statusCounts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusCounts.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-gray-400">{s.name}</span>
                </div>
                <span className="font-medium text-gray-200">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5 col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Progreso por categoría</h2>
          <div className="space-y-3">
            {categoryCounts.map(({ category, fullCategory, total, done }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <Badge label={fullCategory} className={`text-xs ${CATEGORY_COLORS[fullCategory] ?? 'bg-gray-800 text-gray-300'}`} />
                  <span className="text-xs text-gray-500">{done}/{total}</span>
                </div>
                <div className="bg-[#2a2a4a] rounded-full h-1.5">
                  <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Carga por responsable</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={responsibleCounts} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2a2a4a" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill="#2a2a4a" radius={[0, 4, 4, 0]} name="Total" stackId="a" />
              <Bar dataKey="done" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Finalizados" stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Próximas fechas límite</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay fechas próximas</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(item => {
                const isUrgent = isAfter(addDays(new Date(), 30), new Date(item.deadline!))
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    {isUrgent && <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{item.document_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {format(new Date(item.deadline!), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <Badge label={STATUS_LABELS[item.status]} className={`text-xs ${STATUS_COLORS[item.status]}`} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
