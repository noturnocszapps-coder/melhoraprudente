import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabaseClient } from '@/lib/supabase';
import { officialGazetteService } from '@/services/news-sources/official-gazette-service';

/**
 * Helper unificado para validar autenticação e permissões de Admin/Editor
 */
async function validateAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { errorResponse: NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 }) };
  }

  const token = authHeader.substring(7);
  const client = getAuthedSupabaseClient(token);
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    return { errorResponse: NextResponse.json({ success: false, error: "Sessão inválida ou expirada." }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { errorResponse: NextResponse.json({ success: false, error: "Perfil não encontrado." }, { status: 403 }) };
  }

  if (profile.status === "blocked" || profile.status === "suspended") {
    return { errorResponse: NextResponse.json({ success: false, error: "Acesso bloqueado." }, { status: 403 }) };
  }

  if (profile.role !== "admin" && profile.role !== "editor") {
    return { errorResponse: NextResponse.json({ success: false, error: "Acesso não autorizado." }, { status: 403 }) };
  }

  return { user, profile, client };
}

/**
 * GET: Retorna edições e atos cadastrados
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const tablesExist = await officialGazetteService.checkTablesExist(client);
    if (!tablesExist) {
      return NextResponse.json({
        error: "MISSING_TABLES",
        message: "As tabelas do módulo 'Diário Oficial Inteligente' não foram criadas no banco de dados. Execute a migração SQL."
      }, { status: 200 });
    }

    const editions = await officialGazetteService.listEditions(client);
    const items = await officialGazetteService.listItems(undefined, client);

    return NextResponse.json({ success: true, editions, items });
  } catch (error: any) {
    console.error('[API Diario GET] Erro:', error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}

/**
 * POST: Executa a coleta real e análise inteligente de portarias/atos no Diário Oficial
 */
export async function POST(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    console.log('[API Diario POST] Iniciando varredura do Diário Oficial...');
    const result = await officialGazetteService.fetchAndColetarEditions(client);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API Diario POST] Erro:', error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}
