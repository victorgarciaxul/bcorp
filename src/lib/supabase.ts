import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Inicialización lazy: el cliente solo se crea cuando se accede por primera vez.
// Si la app está en modo local (isLocalAuth), nunca se accede a supabase
// y createClient jamás se llama → no puede lanzar "supabaseUrl is required".
let _instance: SupabaseClient | null = null

function getInstance(): SupabaseClient {
  if (_instance) return _instance
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    || 'https://placeholder.supabase.co'
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
    || 'placeholder-anon-key'
  _instance = createClient(url, key)
  return _instance
}

// Proxy transparente: se comporta exactamente igual que un SupabaseClient real
// pero solo instancia el cliente cuando se usa por primera vez.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string) {
    return (getInstance() as unknown as Record<string, unknown>)[prop]
  },
})

export const supabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)
