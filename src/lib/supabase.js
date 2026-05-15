import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uobpekbdofrazmufsilm.supabase.co'
const supabaseKey = 'sb_publishable_P3KXU9n9tdAkp-ZMijfRLA_SzQVJCLE'

export const supabase = createClient(supabaseUrl, supabaseKey)