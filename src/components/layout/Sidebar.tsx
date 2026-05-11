import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, MessageSquare, BarChart2, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { isLocalAuth, clearLocalAuth } from '../../lib/demo'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plan', label: 'Plan de Trabajo', icon: ClipboardList },
  { to: '/sugerencias', label: 'Buzón de Sugerencias', icon: MessageSquare },
  { to: '/encuestas', label: 'Encuestas', icon: BarChart2 },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const handleLogout = async () => {
    if (isLocalAuth()) {
      clearLocalAuth()
      navigate('/login')
    } else {
      await supabase.auth.signOut()
    }
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col">
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">XUL</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">XUL B Corp</p>
            <p className="text-gray-400 text-xs">Panel de gestión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
