import { useEffect, useState } from 'react'
import { sql } from '../lib/db'
import type { Suggestion } from '../lib/database.types'
import { mockSuggestions } from '../lib/mockData'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { ExternalLink, CheckCircle, Inbox, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TYPE_LABELS = { internal: 'Interno', external: 'Externo' }
const TYPE_COLORS = { internal: 'bg-blue-900/50 text-blue-300', external: 'bg-orange-900/50 text-orange-300' }
const STATUS_LABELS = { new: 'Nuevo', read: 'Leído', resolved: 'Resuelto' }
const STATUS_COLORS = { new: 'bg-red-900/50 text-red-300', read: 'bg-yellow-900/50 text-yellow-300', resolved: 'bg-green-900/50 text-green-300' }

export default function SuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'' | 'internal' | 'external'>('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Suggestion | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const data = await sql`SELECT * FROM suggestions ORDER BY created_at DESC`
      setItems(data as Suggestion[])
    } catch {
      setItems(mockSuggestions)
    }
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const markStatus = async (id: string, status: Suggestion['status']) => {
    await sql`UPDATE suggestions SET status = ${status} WHERE id = ${id}`
    await fetchItems()
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  const filtered = items.filter(i => {
    const matchType = filterType === '' || i.type === filterType
    const matchStatus = filterStatus === '' || i.status === filterStatus
    return matchType && matchStatus
  })

  const counts = {
    total: items.length,
    new: items.filter(i => i.status === 'new').length,
    internal: items.filter(i => i.type === 'internal').length,
    external: items.filter(i => i.type === 'external').length,
  }

  const externalFormUrl = `${window.location.origin}/formulario/sugerencia`
  const selectCls = "bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Buzón de Sugerencias</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona las sugerencias internas y externas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: counts.total, color: 'text-white' },
          { label: 'Sin leer', value: counts.new, color: 'text-red-400' },
          { label: 'Internos', value: counts.internal, color: 'text-blue-400' },
          { label: 'Externos', value: counts.external, color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Enlace formulario externo */}
      <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-orange-300">Formulario público para clientes</p>
          <p className="text-xs text-orange-400/70 mt-0.5">Comparte este enlace en tu web para recibir sugerencias externas</p>
        </div>
        <a
          href={externalFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-orange-300 hover:text-orange-100 bg-orange-900/30 border border-orange-500/30 px-3 py-2 rounded-lg"
        >
          <ExternalLink size={14} />
          Ver formulario
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filterType} onChange={e => setFilterType(e.target.value as '' | 'internal' | 'external')} className={selectCls}>
          <option value="">Todos los tipos</option>
          <option value="internal">Interno</option>
          <option value="external">Externo</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500">No hay sugerencias todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left bg-[#1a1a2e] rounded-xl border transition-colors p-4 ${
                item.status === 'new' ? 'border-red-500/30 hover:border-red-500/50' : 'border-[#2a2a4a] hover:border-[#3a3a5a]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge label={TYPE_LABELS[item.type]} className={TYPE_COLORS[item.type]} />
                    <Badge label={STATUS_LABELS[item.status]} className={STATUS_COLORS[item.status]} />
                    {item.is_anonymous && <Badge label="Anónimo" className="bg-gray-800 text-gray-400" />}
                  </div>
                  <p className="font-medium text-gray-200 text-sm truncate">{item.subject}</p>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.created_at), 'dd MMM yyyy', { locale: es })}
                  </p>
                  {item.author_name && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.author_name}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title="Sugerencia" size="md">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge label={TYPE_LABELS[selected.type]} className={TYPE_COLORS[selected.type]} />
              <Badge label={STATUS_LABELS[selected.status]} className={STATUS_COLORS[selected.status]} />
              {selected.is_anonymous && <Badge label="Anónimo" className="bg-gray-800 text-gray-400" />}
            </div>

            {!selected.is_anonymous && selected.author_name && (
              <p className="text-sm text-gray-400"><span className="font-medium text-gray-300">De:</span> {selected.author_name} {selected.email ? `(${selected.email})` : ''}</p>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Asunto</p>
              <p className="text-sm font-medium text-gray-200">{selected.subject}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mensaje</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.message}</p>
            </div>

            <p className="text-xs text-gray-600">{format(new Date(selected.created_at), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}</p>

            <div className="flex gap-2 pt-2 border-t border-[#2a2a4a]">
              {selected.status !== 'read' && (
                <button onClick={() => markStatus(selected.id, 'read')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-900/50">
                  <Eye size={14} /> Marcar como leído
                </button>
              )}
              {selected.status !== 'resolved' && (
                <button onClick={() => markStatus(selected.id, 'resolved')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-900/30 text-green-300 border border-green-500/30 rounded-lg text-sm hover:bg-green-900/50">
                  <CheckCircle size={14} /> Marcar como resuelto
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
