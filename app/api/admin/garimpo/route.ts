import { NextRequest, NextResponse } from 'next/server';
import { supabase, getAuthedSupabaseClient } from '@/lib/supabase';
import { garimpoService } from '@/services/news-sources/garimpo-service';

/**
 * Helper unificado para validar autenticação e permissões de Admin/Editor
 */
async function validateAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[validateAuth] Cabeçalho Authorization ausente ou inválido.");
    return { errorResponse: NextResponse.json({ success: false, error: "Não autorizado. Token de autenticação ausente." }, { status: 401 }) };
  }

  const token = authHeader.substring(7);
  const client = getAuthedSupabaseClient(token);
  const { data: { user }, error: authError } = await client.auth.getUser();
  
  if (authError || !user) {
    console.warn("[validateAuth] Erro ao validar token no Supabase Auth:", authError);
    return { errorResponse: NextResponse.json({ success: false, error: "Sessão inválida ou expirada." }, { status: 401 }) };
  }

  const userEmail = user.email?.toLowerCase().trim() || "";
  const userIdMasked = `${user.id.substring(0, 8)}...`;
  console.log(`[validateAuth] Usuário autenticado com sucesso. ID: ${userIdMasked}, Email: ${userEmail}`);

  // Consulta padrão do perfil no banco com o cliente autenticado sob o RLS do usuário
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.warn(`[validateAuth] Perfil não encontrado no banco de dados para ID: ${userIdMasked}.`);
    return { errorResponse: NextResponse.json({ success: false, error: "Acesso não autorizado. Perfil de usuário não encontrado." }, { status: 403 }) };
  }

  console.log(`[validateAuth] Status do perfil: role=${profile.role}, status=${profile.status}`);

  if (profile.status === "blocked" || profile.status === "suspended") {
    console.warn(`[validateAuth] Usuário ${userEmail} com conta suspensa ou bloqueada.`);
    return { errorResponse: NextResponse.json({ success: false, error: "Acesso não autorizado. Sua conta está suspensa ou bloqueada." }, { status: 403 }) };
  }

  if (profile.role !== "admin" && profile.role !== "editor") {
    console.warn(`[validateAuth] Usuário ${userEmail} tentou acesso sem privilégios. Role: ${profile.role}`);
    return { errorResponse: NextResponse.json({ success: false, error: "Acesso não autorizado" }, { status: 403 }) };
  }

  return { user, profile, client };
}

/**
 * GET: Retorna os candidatos da fila editorial do Garimpo
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    // Verificar se a tabela existe antes usando o cliente autenticado
    const tableExists = await garimpoService.checkTableExists(client);
    if (!tableExists) {
      return NextResponse.json({
        error: "MISSING_TABLE",
        message: "A tabela 'news_candidates' não existe no banco de dados. Por favor, execute a migração SQL."
      }, { status: 200 }); // Retorna 200 com flag de erro para que o frontend exiba o guia de migração amigável
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const candidates = await garimpoService.listCandidates(status, client);
    return NextResponse.json({ candidates });
  } catch (error: any) {
    console.error('[API Garimpo GET] Erro:', error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}

/**
 * POST: Executa a busca/coleta de novas notícias
 */
export async function POST(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const { limit } = await req.json().catch(() => ({ limit: 10 }));
    
    console.log(`[API Garimpo POST] Iniciando varredura com limite de ${limit} itens usando cliente autenticado...`);
    const stats = await garimpoService.buscarNovasNoticias(limit, client);

    if (stats.errors.includes('MISSING_TABLE_ERROR')) {
      return NextResponse.json({
        error: "MISSING_TABLE",
        message: "A tabela 'news_candidates' não existe no banco de dados. Por favor, execute a migração SQL."
      }, { status: 200 });
    }

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('[API Garimpo POST] Erro de varredura:', error);
    return NextResponse.json({ error: "Erro interno durante a varredura: " + error.message }, { status: 500 });
  }
}
