import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabaseClient } from '@/lib/supabase';
import { councilorCrawlerService } from '@/services/news-sources/councilor-crawler-service';

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
 * GET: Retorna vereadores e atos cadastrados
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const tablesExist = await councilorCrawlerService.checkTablesExist(client);
    if (!tablesExist) {
      return NextResponse.json({
        error: "MISSING_TABLES",
        message: "As tabelas do módulo 'Raio-X dos Vereadores' não foram criadas no banco de dados. Execute a migração SQL."
      }, { status: 200 });
    }

    // Seeder automático caso esteja vazio
    await councilorCrawlerService.seedCouncilors(client);

    const councilors = await councilorCrawlerService.listCouncilors(client);
    const acts = await councilorCrawlerService.listActs(client);

    return NextResponse.json({ success: true, councilors, acts });
  } catch (error: any) {
    console.error('[API Vereadores GET] Erro:', error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}

/**
 * POST: Executa a coleta real e análise inteligente de atos na Câmara para o vereador William César Leite (VER-1449)
 */
export async function POST(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    console.log('[API Vereadores POST] Iniciando sincronização controlada de atos de William César Leite (VER-1449)...');

    // 1. Confirmar que o vereador existe e obter seu UUID real
    const { data: william, error: williamError } = await client
      .from('councilors')
      .select('id, name')
      .eq('external_id', 'VER-1449')
      .single();

    if (williamError || !william) {
      return NextResponse.json({
        success: false,
        error: "Vereador William César Leite (VER-1449) não cadastrado na base. Favor realizar seed primeiro."
      }, { status: 404 });
    }

    console.log(`[API Vereadores POST] Vereador alvo confirmado: ${william.name} (UUID: ${william.id})`);

    // 2. Executar a sincronização controlada via Crawler Service
    const syncResult = await councilorCrawlerService.fetchAndColetarAtosWilliam(client);

    // 3. Executar SELECT real pós-persistência das tabelas para confirmação detalhada (pelo menos 5 atos)
    const { data: testActs, error: testActsError } = await client
      .from('legislative_acts')
      .select(`
        id,
        external_id,
        act_type,
        number,
        year,
        status,
        official_url,
        authors:councilor_act_authors (
          id,
          councilor_id,
          is_primary
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (testActsError) {
      console.error('[API Vereadores POST] Erro na leitura de confirmação de atos:', testActsError);
    }

    return NextResponse.json({
      success: true,
      message: "Sincronização de amostra de atos reais de William César Leite concluída com sucesso!",
      william_uuid: william.id,
      stats: {
        paginas_consultadas: syncResult.paginas_consultadas,
        totalFound: syncResult.coletados,
        inserted: syncResult.inseridos,
        updated: syncResult.atualizados,
        vinculos_criados: syncResult.vinculos_criados,
        vinculos_atualizados: syncResult.vinculos_atualizados,
        vinculos_existentes_sem_alteracao: syncResult.vinculos_existentes_sem_alteracao,
        duplicados_fisicos: syncResult.duplicados_fisicos,
        existentes_sem_alteracao: syncResult.existentes_sem_alteracao,
        registros_corrigidos_html: syncResult.registros_corrigidos_html,
        total_antes: syncResult.total_antes,
        total_depois: syncResult.total_depois,
        failed: syncResult.errors.length
      },
      errors: syncResult.errors,
      results: syncResult.results,
      confirmedRecords: testActs || []
    });
  } catch (error: any) {
    console.error('[API Vereadores POST] Erro no fluxo de atos:', error);
    return NextResponse.json({ success: false, error: "Erro interno: " + error.message }, { status: 500 });
  }
}
