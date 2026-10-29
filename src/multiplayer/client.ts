import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

let client: SupabaseClient | null = null
let verifiedUserId: string | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured || !supabaseUrl || !supabasePublishableKey) {
    throw new Error('O modo online ainda não foi conectado ao Supabase neste ambiente.')
  }

  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  }

  return client
}

export async function ensureAnonymousSession(captchaToken?: string) {
  const supabase = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (sessionData.session && verifiedUserId === sessionData.session.user.id) return sessionData.session
  if (sessionData.session) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (!userError && userData.user) {
      verifiedUserId = userData.user.id
      return sessionData.session
    }
    await supabase.auth.signOut({ scope: 'local' })
  }

  const { data, error } = await supabase.auth.signInAnonymously(
    captchaToken ? { options: { captchaToken } } : undefined,
  )
  if (error) throw error
  if (!data.session) throw new Error('Não foi possível estabelecer uma sessão anônima.')
  verifiedUserId = data.session.user.id
  return data.session
}
