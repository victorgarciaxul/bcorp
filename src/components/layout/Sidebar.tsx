import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, MessageSquare, BarChart2, Lock } from 'lucide-react'

const CARLA_EMAIL = 'carlagarcia@xul.es'

const getCurrentEmail = () => localStorage.getItem('xul_tracker_email') ?? ''

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plan', label: 'Plan de Trabajo', icon: ClipboardList },
  { to: '/sugerencias', label: 'Buzón de Sugerencias', icon: MessageSquare },
  { to: '/encuestas', label: 'Encuestas', icon: BarChart2 },
]

export default function Sidebar() {
  const email = getCurrentEmail()
  const isCarla = email === CARLA_EMAIL

  return (
    <aside className="fixed top-4 left-4 bottom-4 w-56 bg-[#16162a]/90 backdrop-blur-md border border-[#2a2a4a] rounded-2xl flex flex-col z-40 shadow-2xl">
      <div className="px-4 py-4 border-b border-[#2a2a4a] flex items-center justify-center">
        <img src="/logo.webp" alt="Logo" className="h-14 object-contain" />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-[#2a2a4a] hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {isCarla && (
          <NavLink
            to="/encuestas-carla"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:bg-[#2a2a4a] hover:text-white'
              }`
            }
          >
            <Lock size={18} />
            Encuestas Carla
          </NavLink>
        )}
      </nav>

    </aside>
  )
}
