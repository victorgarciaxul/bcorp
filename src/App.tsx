import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { isLocalAuth } from './lib/demo'
import type { Session } from '@supabase/supabase-js'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import DashboardPage from './pages/DashboardPage'
import PlanPage from './pages/PlanPage'
import SuggestionsPage from './pages/SuggestionsPage'
import SurveysPage from './pages/SurveysPage'
import SuggestionForm from './pages/public/SuggestionForm'
import SurveyFormPage from './pages/public/SurveyFormPage'

function ProtectedRoute({ children, session }: { children: React.ReactNode; session: Session | null }) {
  if (!isLocalAuth() && !session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (isLocalAuth()) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={(isLocalAuth() || session) ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/formulario/sugerencia" element={<SuggestionForm type="external" />} />
        <Route path="/formulario/sugerencia-interna" element={<SuggestionForm type="internal" />} />
        <Route path="/encuesta/:token" element={<SurveyFormPage />} />

        {/* Rutas protegidas */}
        <Route
          element={
            <ProtectedRoute session={session}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/sugerencias" element={<SuggestionsPage />} />
          <Route path="/encuestas" element={<SurveysPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
