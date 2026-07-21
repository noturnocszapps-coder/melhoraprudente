import { NextRequest, NextResponse } from 'next/server';
import { supabase, getAuthedSupabaseClient } from '@/lib/supabase';
import { garimpoService } from '@/services/news-sources/garimpo-service';

async function validateAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { errorResponse: NextResponse.json({ success: false, error: "Não autorizado. Token ausente." }, { status: 401 }) };
  }

  const token = authHeader.substring(7);
  const client = getAuthedSupabaseClient(token);
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    return { errorResponse: NextResponse.json({ success: false, error: "Sessão inválida." }, { status: 401 }) };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status === "blocked" || profile.status === "suspended") {
    return { errorResponse: NextResponse.json({ success: false, error: "Acesso bloqueado." }, { status: 403 }) };
  }

  if (profile.role !== "admin" && profile.role !== "editor") {
    return { errorResponse: NextResponse.json({ success: false, error: "Sem permissão de admin/editor." }, { status: 403 }) };
  }

  return { user, profile, client };
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { candidate_id, candidate_ids, process_all_pending } = body;

    let targetIds: string[] = [];

    if (candidate_id) {
      targetIds = [candidate_id];
    } else if (Array.isArray(candidate_ids) && candidate_ids.length > 0) {
      targetIds = candidate_ids;
    } else if (process_all_pending) {
      const { data: pendingItems, error: fetchErr } = await client
        .from('news_candidates')
        .select('id')
        .eq('status', 'pending');

      if (fetchErr) {
        return NextResponse.json({ error: "Erro ao buscar notícias pendentes: " + fetchErr.message }, { status: 500 });
      }
      targetIds = (pendingItems || []).map(p => p.id);
    } else {
      return NextResponse.json({ error: "Parâmetros inválidos. Forneça candidate_id, candidate_ids ou process_all_pending." }, { status: 400 });
    }

    if (targetIds.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        reprocessed: 0,
        failures: 0,
        unchanged: 0,
        failedItems: [],
        updatedCandidates: []
      });
    }

    const report = {
      success: true,
      total: targetIds.length,
      reprocessed: 0,
      failures: 0,
      unchanged: 0,
      failedItems: [] as Array<{ id: string; title: string; source: string; url: string; error: string }>,
      updatedCandidates: [] as any[]
    };

    // Processamento em lotes controlados (tamanho do lote = 3) com tratamento de erros isolado
    const BATCH_SIZE = 3;
    for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
      const batch = targetIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (id) => {
          try {
            const updated = await garimpoService.reprocessCandidate(id, client);
            report.reprocessed++;
            report.updatedCandidates.push(updated);
          } catch (err: any) {
            report.failures++;
            let title = id;
            let source = 'Desconhecido';
            let url = '';
            try {
              const { data: cand } = await client.from('news_candidates').select('original_title, source_name, original_url').eq('id', id).single();
              if (cand) {
                title = cand.original_title || id;
                source = cand.source_name || 'Desconhecido';
                url = cand.original_url || '';
              }
            } catch (_) {}

            report.failedItems.push({
              id,
              title,
              source,
              url,
              error: err.message || String(err)
            });
          }
        })
      );

      // Pequeno delay entre lotes para estabilidade
      if (i + BATCH_SIZE < targetIds.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[API Garimpo Reprocess POST] Erro:', error);
    return NextResponse.json({ error: "Erro interno durante reprocessamento: " + error.message }, { status: 500 });
  }
}
