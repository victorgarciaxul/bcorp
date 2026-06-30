import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemoMode } from '../lib/demo'
import { mockSuggestions } from '../lib/mockData'
import type { Suggestion } from '../lib/database.types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { ExternalLink, CheckCircle, Inbox, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TYPE_LABELS = { internal: 'Interno', external: 'Externo' }
const TYPE_COLORS = { internal: 'bg-blue-100 text-blue-700', external: 'bg-orange-100 text-orange-700' }
const STATUS_LABELS = { new: 'Nuevo', read: 'Leído', resolved: 'Resuelto' }
const STATUS_COLORS = { new: 'bg-red-100 text-red-700', read: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700' }

export default function SuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'' | 'internal' | 'external'>('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Suggestion | null>(null)

  const [demoItems, setDemoItems] = useState<Suggestion[]>(mockSuggestions)

  const fetchItems = async () => {
    setLoading(true)
    if (isDemoMode()) {
      setItems(demoItems)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false })
    setItems((data ?? []) as Suggestion[])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const markStatus = async (id: string, status: Suggestion['status']) => {
    if (isDemoMode()) {
      const updated = demoItems.map(i => i.id === id ? { ...i, status } : i)
      setDemoItems(updated)
      setItems(updated)
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
      return
    }
    await supabase.from('suggestions').update({ status } as Record<string, unknown>).eq('id', id)
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buzón de Sugerencias</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona las sugerencias internas y externas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-900' },
          { label: 'Sin leer', value: counts.new, color: 'text-red-600' },
          { label: 'Internos', value: counts.internal, color: 'text-blue-600' },
          { label: 'Externos', value: counts.external, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Enlace formulario externo */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-orange-800">Formulario público para clientes</p>
          <p className="text-xs text-orange-600 mt-0.5">Comparte este enlace en tu web para recibir sugerencias externas</p>
        </div>
        <a
          href={externalFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-900 bg-white border border-orange-300 px-3 py-2 rounded-lg"
        >
          <ExternalLink size={14} />
          Ver formulario
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as '' | 'internal' | 'external')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todos los tipos</option>
          <option value="internal">Interno</option>
          <option value="external">Externo</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No hay sugerencias todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left bg-white rounded-xl border transition-colors p-4 ${
                item.status === 'new' ? 'border-red-200 hover:border-red-300' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge label={TYPE_LABELS[item.type]} className={TYPE_COLORS[item.type]} />
                    <Badge label={STATUS_LABELS[item.status]} className={STATUS_COLORS[item.status]} />
                    {item.is_anonymous && (
                      <Badge label="Anónimo" className="bg-gray-100 text-gray-500" />
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{item.subject}</p>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">
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
              {selected.is_anonymous && <Badge label="Anónimo" className="bg-gray-100 text-gray-500" />}
            </div>

            {!selected.is_anonymous && selected.author_name && (
              <p className="text-sm text-gray-600"><span className="font-medium">De:</span> {selected.author_name} {selected.email ? `(${selected.email})` : ''}</p>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Asunto</p>
              <p className="text-sm font-medium text-gray-900">{selected.subject}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mensaje</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.message}</p>
            </div>

            <p className="text-xs text-gray-400">{format(new Date(selected.created_at), "dd 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}</p>

            <div className="flex gap-2 pt-2 border-t">
              {selected.status !== 'read' && (
                <button
                  onClick={() => markStatus(selected.id, 'read')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm hover:bg-yellow-100"
                >
                  <Eye size={14} /> Marcar como leído
                </button>
              )}
              {selected.status !== 'resolved' && (
                <button
                  onClick={() => markStatus(selected.id, 'resolved')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100"
                >
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
