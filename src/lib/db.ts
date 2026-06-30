import { neon } from '@neondatabase/serverless'

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL as string
export const sql = neon(DATABASE_URL)
