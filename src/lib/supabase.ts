import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Fallback con valores vacíos cuando no hay Supabase configurado (modo local).
// El cliente no se usará porque isLocalAuth() cortocircuita todas las llamadas.
export const supabase = createClient(
  supabaseUrl     ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
)

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
