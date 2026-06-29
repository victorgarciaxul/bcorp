import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLocalAuth, setLocalAuth } from './lib/demo'

// SSO: ejecutar sincrónicamente antes de cualquier render para que
// ProtectedRoute ya vea la sesión activa desde el primer ciclo
;(() => {
  const params   = new URLSearchParams(window.location.search)
  const ssoEmail = params.get('sso_email')
  if (!ssoEmail) return
  const allowed  = ['victorgarcia@xul.es','carlagarcia@xul.es','tech@xul.es','josecastillo@xul.es','elenarojo@xul.es']
  if (!allowed.includes(ssoEmail.toLowerCase())) return
  setLocalAuth()
  localStorage.setItem('xul_tracker_email', ssoEmail.toLowerCase())
  window.history.replaceState({}, '', window.location.pathname)
})()
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import DashboardPage from './pages/DashboardPage'
import PlanPage from './pages/PlanPage'
import SuggestionsPage from './pages/SuggestionsPage'
import SurveysPage from './pages/SurveysPage'
import SuggestionForm from './pages/public/SuggestionForm'
import SurveyFormPage from './pages/public/SurveyFormPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLocalAuth()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLocalAuth() ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/formulario/sugerencia" element={<SuggestionForm type="external" />} />
        <Route path="/formulario/sugerencia-interna" element={<SuggestionForm type="internal" />} />
        <Route path="/encuesta/:token" element={<SurveyFormPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
