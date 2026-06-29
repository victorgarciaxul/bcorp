const ALLOWED_EMAILS = [
  'tech@xul.es',
  'elenarojo@xul.es',
  'josecastillo@xul.es',
  'carlagarcia@xul.es',
]
const LOCAL_PASSWORD = 'Xul14$'

export const checkLocalCredentials = (email: string, password: string) =>
  ALLOWED_EMAILS.includes(email.toLowerCase()) && password === LOCAL_PASSWORD

export const isLocalAuth = () => sessionStorage.getItem('xul_auth') === 'true'
export const setLocalAuth = () => sessionStorage.setItem('xul_auth', 'true')
export const clearLocalAuth = () => sessionStorage.removeItem('xul_auth')

// Demo mode = auth local activa (sin Supabase)
export const isDemoMode = () => isLocalAuth()
export const enterDemo = setLocalAuth
export const exitDemo  = clearLocalAuth
