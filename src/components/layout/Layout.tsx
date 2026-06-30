import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <main className="ml-64 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
