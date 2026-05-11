// Auth local (credenciales fijas mientras no haya Supabase configurado)
const LOCAL_EMAIL    = 'tech@xul.es'
const LOCAL_PASSWORD = 'Xul14$'

export const checkLocalCredentials = (email: string, password: string) =>
  email === LOCAL_EMAIL && password === LOCAL_PASSWORD

export const isLocalAuth = () => localStorage.getItem('xul_auth') === 'true'
export const setLocalAuth = () => localStorage.setItem('xul_auth', 'true')
export const clearLocalAuth = () => localStorage.removeItem('xul_auth')

// Demo mode = auth local activa (sin Supabase)
export const isDemoMode = () => isLocalAuth()
export const enterDemo = setLocalAuth
export const exitDemo  = clearLocalAuth
