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
 * POST: Executa a coleta real e análise inteligente de atos na Câmara
 */
export async function POST(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    console.log('[API Vereadores POST] Iniciando teste controlado de 1 único vereador...');

    // 1. Coleta da lista de vereadores ativos em tempo real do site oficial
    let officialList: any[] = [];
    try {
      officialList = await councilorCrawlerService.fetchOfficialCouncilorsList();
    } catch (crawlerErr: any) {
      console.warn('[API Vereadores POST] Falha ao coletar vereadores em tempo real:', crawlerErr.message);
    }

    // 2. Localizar o vereador WILLIAM CÉSAR LEITE (external_id: VER-1449)
    let targetCouncilor = officialList.find(c => c.external_id === 'VER-1449');

    if (!targetCouncilor) {
      console.log('[API Vereadores POST] Vereador VER-1449 não encontrado na listagem ao vivo, utilizando dados estáticos seguros.');
      const backupList = require('@/services/news-sources/councilor-crawler-service').REAL_COUNCILORS;
      targetCouncilor = backupList.find((c: any) => c.external_id === 'VER-1449');
    }

    if (!targetCouncilor) {
      return NextResponse.json({ success: false, error: "Vereador William César Leite não foi localizado nos dados de backup ou ao vivo." }, { status: 404 });
    }

    console.log('[API Vereadores POST] Vereador coletado para teste de persistência:', targetCouncilor.name);

    // 3. Executar o UPSERT no Supabase usando o cliente autenticado (respeitando RLS)
    const { data: upsertData, error: upsertError } = await client
      .from('councilors')
      .upsert({
        external_id: targetCouncilor.external_id,
        name: targetCouncilor.name,
        display_name: targetCouncilor.display_name,
        party: targetCouncilor.party,
        photo_url: targetCouncilor.photo_url || null,
        official_url: targetCouncilor.official_url,
        legislature: targetCouncilor.legislature || '2025-2028',
        is_active: targetCouncilor.is_active ?? true
      }, { onConflict: 'external_id' })
      .select();

    if (upsertError) {
      console.error('[API Vereadores POST] Erro de persistência (UPSERT) com RLS:', upsertError);
      return NextResponse.json({
        success: false,
        error: "Falha na persistência sob RLS: " + upsertError.message,
        details: upsertError
      }, { status: 400 });
    }

    console.log('[API Vereadores POST] UPSERT concluído com sucesso:', upsertData);

    // 4. Executar uma consulta real (SELECT) posterior pelo external_id
    const { data: selectData, error: selectError } = await client
      .from('councilors')
      .select('*')
      .eq('external_id', 'VER-1449')
      .single();

    if (selectError) {
      console.error('[API Vereadores POST] Erro na leitura de confirmação:', selectError);
      return NextResponse.json({
        success: false,
        error: "Falha na leitura pós-persistência: " + selectError.message,
        details: selectError
      }, { status: 400 });
    }

    console.log('[API Vereadores POST] Leitura de confirmação realizada com sucesso:', selectData);

    return NextResponse.json({
      success: true,
      message: "Teste de persistência de 1 único vereador realizado com sucesso sob segurança total do RLS!",
      collected: targetCouncilor,
      upsertResult: upsertData[0],
      confirmedRecord: selectData
    });
  } catch (error: any) {
    console.error('[API Vereadores POST] Erro:', error);
    return NextResponse.json({ success: false, error: "Erro interno: " + error.message }, { status: 500 });
  }
}
