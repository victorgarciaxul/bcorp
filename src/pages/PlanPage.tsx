import { useEffect, useState } from 'react'
import { sql } from '../lib/db'
import type { PlanItem, PlanStatus } from '../lib/database.types'
import { CATEGORY_COLORS, STATUS_COLORS, STATUS_DOT, STATUS_LABELS, CATEGORIES } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Search, ExternalLink, ChevronDown, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const YEARS = [2026, 2027, 2028]

export default function PlanPage() {
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(2026)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<PlanItem | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    const data = await sql`SELECT * FROM plan_items WHERE year = ${year} ORDER BY category`
    setItems(data as PlanItem[])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [year])

  const filtered = items.filter(item => {
    const matchSearch = search === '' ||
      item.document_name.toLowerCase().includes(search.toLowerCase()) ||
      item.indicator_code.toLowerCase().includes(search.toLowerCase()) ||
      (item.responsible ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === '' || item.category === filterCategory
    const matchStatus = filterStatus === '' || item.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, PlanItem[]>)

  const saveItem = async (updates: Partial<PlanItem>) => {
    if (!selected) return
    setSaving(true)
    await sql`
      UPDATE plan_items SET
        status = ${updates.status ?? selected.status},
        notes = ${updates.notes ?? null},
        responsible = ${updates.responsible ?? null},
        deadline = ${updates.deadline ?? null},
        evidence_url = ${updates.evidence_url ?? null}
      WHERE id = ${selected.id}
    `
    await fetchItems()
    setSelected(prev => prev ? { ...prev, ...updates } : prev)
    setSaving(false)
  }

  const totalItems = items.length
  const done = items.filter(i => i.status === 'finalizado').length
  const pct = totalItems > 0 ? Math.round((done / totalItems) * 100) : 0

  const selectCls = "bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Plan de Trabajo B Corp</h1>
            <p className="text-gray-500 text-sm mt-1">{totalItems} ítems · {done} finalizados · {pct}% completado</p>
          </div>
          <div className="relative">
            <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-[#2a2a4a] rounded-full h-2 mb-6">
          <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por documento, indicador, responsable..."
              className="w-full pl-9 pr-3 py-2 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="relative">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Cargando...</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const catDone = categoryItems.filter(i => i.status === 'finalizado').length
            return (
              <div key={category} className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#2a2a4a] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge label={category} className={CATEGORY_COLORS[category] ?? 'bg-gray-800 text-gray-300'} />
                    <span className="text-xs text-gray-500">{catDone}/{categoryItems.length} finalizados</span>
                  </div>
                  <div className="w-24 bg-[#2a2a4a] rounded-full h-1.5">
                    <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: `${categoryItems.length > 0 ? (catDone / categoryItems.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="divide-y divide-[#2a2a4a]">
                  {categoryItems.map(item => (
                    <button key={item.id} onClick={() => setSelected(item)}
                      className="w-full text-left px-5 py-4 hover:bg-[#2a2a4a]/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[item.status]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-gray-500">{item.indicator_code}</span>
                              <span className="font-medium text-gray-200 text-sm">{item.document_name}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              {item.responsible && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <User size={11} /> {item.responsible}
                                </span>
                              )}
                              {item.deadline && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar size={11} />
                                  {format(new Date(item.deadline), 'dd MMM yyyy', { locale: es })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge label={STATUS_LABELS[item.status]} className={STATUS_COLORS[item.status]} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16 text-gray-500">No hay resultados para los filtros aplicados.</div>
          )}
        </div>
      )}

      {selected && (
        <PlanItemModal item={selected} onClose={() => setSelected(null)} onSave={saveItem} saving={saving} />
      )}
    </div>
  )
}

function PlanItemModal({
  item, onClose, onSave, saving,
}: {
  item: PlanItem
  onClose: () => void
  onSave: (updates: Partial<PlanItem>) => Promise<void>
  saving: boolean
}) {
  const [status, setStatus] = useState<PlanStatus>(item.status)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [responsible, setResponsible] = useState(item.responsible ?? '')
  const [deadline, setDeadline] = useState(item.deadline ?? '')
  const [evidenceUrl, setEvidenceUrl] = useState(item.evidence_url ?? '')

  const handleSave = () => {
    onSave({ status, notes, responsible, deadline: deadline || null, evidence_url: evidenceUrl || null })
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <Modal open onClose={onClose} title={item.document_name} size="xl">
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={item.category} className={CATEGORY_COLORS[item.category] ?? 'bg-gray-800 text-gray-300'} />
          <span className="text-xs font-mono text-gray-500 bg-[#1a1a2e] px-2 py-0.5 rounded border border-[#2a2a4a]">{item.indicator_code}</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción del estándar B Corp</label>
          <div className="bg-[#0f0f1a] rounded-lg p-4 text-sm text-gray-400 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-[#2a2a4a]">
            {item.content || 'Sin descripción disponible.'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Estado</label>
            <select value={status} onChange={e => setStatus(e.target.value as PlanStatus)}
              className={inputCls + ' appearance-none'}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Responsable</label>
            <input value={responsible} onChange={e => setResponsible(e.target.value)} className={inputCls} placeholder="Nombre del responsable" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Fecha límite</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Enlace de evidencia</label>
            <div className="flex gap-2">
              <input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} className={inputCls} placeholder="https://..." />
              {evidenceUrl && (
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-[#2a2a4a] rounded-lg text-sm text-gray-400 hover:text-white border border-[#2a2a4a]">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Notas internas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className={inputCls + ' resize-none'} placeholder="Añade notas internas..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
