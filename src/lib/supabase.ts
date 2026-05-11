import { createClient } from '@supabase/supabase-js'

// Usa || en lugar de ?? para cubrir también strings vacíos que
// Vercel puede inyectar cuando la variable no está configurada.
const supabaseUrl     = (import.meta.env.VITE_SUPABASE_URL     as string) || 'https://placeholder.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseConfigured =
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-anon-key'
