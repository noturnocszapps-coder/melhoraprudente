import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('placeholder');

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.error(
    'ERRO DE CONFIGURAÇÃO: As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não estão configuradas ou são inválidas. Certifique-se de configurar estas variáveis no painel de configurações para que o banco de dados funcione de forma correta.'
  );
}

// Para prevenir falhas drásticas no build caso as variáveis de ambiente não estejam prontas, usamos placeholders limpos
const activeUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const activeKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(
  activeUrl,
  activeKey
);

/**
 * Cria um cliente Supabase específico para a requisição, propagando o JWT do usuário autenticado.
 * Isso garante que todas as operações executadas por este cliente respeitem as políticas de RLS.
 */
export function getAuthedSupabaseClient(token: string) {
  return createClient(
    activeUrl,
    activeKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}


