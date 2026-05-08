export const isDemoMode = () =>
  localStorage.getItem('xul_demo') === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export const enterDemo = () => localStorage.setItem('xul_demo', 'true')
export const exitDemo = () => localStorage.removeItem('xul_demo')
