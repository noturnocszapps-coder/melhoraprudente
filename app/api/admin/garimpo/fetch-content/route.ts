import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabaseClient } from '@/lib/supabase';
import { PrefeituraPrudenteSource } from '@/services/news-sources/prefeitura-prudente';
import { G1PresidentePrudenteSource } from '@/services/news-sources/g1-presidente-prudente';
import { InovaPrudenteSource } from '@/services/news-sources/inova-prudente';
import { GarimpoService } from '@/services/news-sources/garimpo-service';

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
 * GET: Obtém o conteúdo completo de uma notícia original a partir da URL (Prefeitura, G1 ou Inova)
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const candidateId = searchParams.get('candidate_id');

    if (!url) {
      return NextResponse.json({ error: "Parâmetro 'url' é obrigatório." }, { status: 400 });
    }

    console.log(`[API FetchContent] Buscando conteúdo para URL: ${url}`);
    
    // Instanciar o scraper apropriado
    let scraper;
    let sourceName = 'Outro';
    if (url.startsWith('https://presidenteprudente.sp.gov.br/')) {
      scraper = new PrefeituraPrudenteSource();
      sourceName = 'Prefeitura Municipal';
    } else if (url.includes('g1.globo.com')) {
      scraper = new G1PresidentePrudenteSource();
      sourceName = 'G1 Presidente Prudente';
    } else if (url.includes('inovaprudente.com.br')) {
      scraper = new InovaPrudenteSource();
      sourceName = 'Inova Prudente';
    } else {
      return NextResponse.json({ error: "Portal ou domínio de origem não suportado pelo Garimpo por IA." }, { status: 400 });
    }
    
    // Obter detalhes passando um objeto ScrapedNewsItem mínimo
    const result = await scraper.fetchItemDetails({
      externalId: url.split('/').pop() || 'temp',
      title: 'Original',
      url: url,
      publishedAt: new Date().toISOString()
    });

    let finalAiSummary = result.excerpt || '';

    // Se um ID de candidata foi passado, vamos atualizar no banco e gerar análise da IA completa
    if (candidateId && result.content && client) {
      try {
        // Obter título original real da candidata se "Original" for retornado como título fictício
        let originalTitle = result.title && result.title !== 'Original' ? result.title : '';
        if (!originalTitle) {
          const { data: candData } = await client
            .from('news_candidates')
            .select('original_title')
            .eq('id', candidateId)
            .single();
          originalTitle = candData?.original_title || 'Notícia';
        }

        console.log(`[API FetchContent] Gerando análise editorial inteligente completa para a candidata: ${candidateId}`);
        const garimpoService = new GarimpoService();
        const aiAnalysis = await garimpoService.analyzeWithGemini(
          originalTitle,
          result.content,
          sourceName,
          url.includes('g1.globo.com')
        );

        finalAiSummary = aiAnalysis.ai_summary || result.excerpt || '';

        console.log(`[API FetchContent] Salvando conteúdo original e análise da IA no banco para id: ${candidateId}`);
        
        const updatePayload: any = {
          original_content: result.content,
          ai_content: finalAiSummary,
          ai_summary: finalAiSummary,
          updated_at: new Date().toISOString()
        };

        const { error: dbError } = await client
          .from('news_candidates')
          .update(updatePayload)
          .eq('id', candidateId);

        if (dbError) {
          console.warn('[API FetchContent] Erro ao atualizar novas colunas (tentando fallback tradicional):', dbError);
          // Fallback seguro caso as colunas original_content ou ai_content ainda não estejam presentes
          await client
            .from('news_candidates')
            .update({
              ai_summary: finalAiSummary,
              updated_at: new Date().toISOString()
            })
            .eq('id', candidateId);
        }
      } catch (err) {
        console.error('[API FetchContent] Erro ao gerar IA ou salvar no banco:', err);
      }
    }

    return NextResponse.json({
      success: true,
      title: result.title,
      content: result.content,
      imageUrl: result.imageUrl || null,
      excerpt: result.excerpt,
      ai_summary: finalAiSummary
    });
  } catch (error: any) {
    console.error('[API FetchContent GET] Erro:', error);
    return NextResponse.json({ error: "Erro interno ao buscar conteúdo original: " + error.message }, { status: 500 });
  }
}
