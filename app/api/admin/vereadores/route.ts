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

    console.log('[API Vereadores POST] Iniciando sincronização completa da Legislatura 2025–2028...');

    // 1. Coleta da lista de vereadores ativos em tempo real do site oficial
    let officialList: any[] = [];
    try {
      officialList = await councilorCrawlerService.fetchOfficialCouncilorsList();
    } catch (crawlerErr: any) {
      console.warn('[API Vereadores POST] Falha ao coletar vereadores em tempo real:', crawlerErr.message);
    }

    if (!officialList || officialList.length === 0) {
      officialList = require('@/services/news-sources/councilor-crawler-service').REAL_COUNCILORS;
    }

    console.log(`[API Vereadores POST] Total de vereadores para sincronização: ${officialList.length}`);

    // 2. Buscar registros existentes no banco para detectar inserções vs atualizações e auditar UUIDs
    const { data: dbCouncilors, error: selectDbError } = await client
      .from('councilors')
      .select('id, external_id');

    if (selectDbError) {
      console.error('[API Vereadores POST] Erro ao carregar perfis de comparação do banco:', selectDbError);
    }

    const dbMap = new Map<string, string>();
    if (dbCouncilors) {
      dbCouncilors.forEach(c => dbMap.set(c.external_id, c.id));
    }

    const results: any[] = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    // 3. Executar o UPSERT de cada vereador mantendo integridade e respeitando RLS
    for (const targetCouncilor of officialList) {
      const existsInDb = dbMap.has(targetCouncilor.external_id);
      const originalUuid = dbMap.get(targetCouncilor.external_id);

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
        console.error(`[API Vereadores POST] Erro de persistência para ${targetCouncilor.name}:`, upsertError);
        failedCount++;
        results.push({
          name: targetCouncilor.name,
          external_id: targetCouncilor.external_id,
          party: targetCouncilor.party,
          status: 'FALHOU',
          error: upsertError.message
        });
      } else {
        const persistedRow = upsertData[0];
        const currentUuid = persistedRow.id;
        const uuidUnchanged = existsInDb ? (originalUuid === currentUuid) : true;

        if (existsInDb) {
          updatedCount++;
        } else {
          insertedCount++;
        }

        results.push({
          id: currentUuid,
          name: persistedRow.name,
          display_name: persistedRow.display_name,
          external_id: persistedRow.external_id,
          party: persistedRow.party,
          is_active: persistedRow.is_active,
          status: existsInDb ? 'ATUALIZADO' : 'INSERIDO',
          uuid_preserved: uuidUnchanged
        });
      }
    }

    // 4. Executar consulta real (SELECT) posterior para confirmação e relatório
    const { data: selectAllData, error: selectAllError } = await client
      .from('councilors')
      .select('*')
      .order('display_name', { ascending: true });

    if (selectAllError) {
      console.error('[API Vereadores POST] Erro na leitura de confirmação completa:', selectAllError);
      return NextResponse.json({
        success: false,
        error: "Falha na leitura pós-persistência completa: " + selectAllError.message,
        details: selectAllError
      }, { status: 400 });
    }

    console.log(`[API Vereadores POST] Confirmação obtida. Total no banco: ${selectAllData.length}`);

    return NextResponse.json({
      success: true,
      message: "Sincronização da Legislatura 2025–2028 concluída com sucesso!",
      stats: {
        totalFound: officialList.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
        confirmedInDb: selectAllData.length
      },
      results,
      confirmedRecords: selectAllData
    });
  } catch (error: any) {
    console.error('[API Vereadores POST] Erro:', error);
    return NextResponse.json({ success: false, error: "Erro interno: " + error.message }, { status: 500 });
  }
}
