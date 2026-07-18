import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabaseClient } from '@/lib/supabase';
import { PrefeituraPrudenteSource } from '@/services/news-sources/prefeitura-prudente';

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
 * GET: Obtém o conteúdo completo de uma notícia original na prefeitura
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: "Parâmetro 'url' é obrigatório." }, { status: 400 });
    }

    // Validar se é uma URL permitida do portal da prefeitura
    if (!url.startsWith('https://presidenteprudente.sp.gov.br/site/noticia/')) {
      return NextResponse.json({ error: "URL inválida ou domínio não permitido." }, { status: 400 });
    }

    console.log(`[API FetchContent] Buscando conteúdo para URL: ${url}`);
    
    // Instanciar o scraper
    const scraper = new PrefeituraPrudenteSource();
    
    // Obter detalhes passando um objeto ScrapedNewsItem mockado mínimo
    const result = await scraper.fetchItemDetails({
      externalId: url.split('/').pop() || 'temp',
      title: 'Original',
      url: url,
      publishedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      title: result.title,
      content: result.content,
      imageUrl: result.imageUrl || null,
      excerpt: result.excerpt
    });
  } catch (error: any) {
    console.error('[API FetchContent GET] Erro:', error);
    return NextResponse.json({ error: "Erro interno ao buscar conteúdo original: " + error.message }, { status: 500 });
  }
}
