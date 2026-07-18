import { NextRequest, NextResponse } from 'next/server';
import { supabase, getAuthedSupabaseClient } from '@/lib/supabase';
import { garimpoService } from '@/services/news-sources/garimpo-service';

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

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, client } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID do candidato é obrigatório" }, { status: 400 });
    }

    const success = await garimpoService.rejectCandidate(id, client);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API Garimpo Reject] Erro:', error);
    return NextResponse.json({ error: "Erro ao rejeitar candidato: " + error.message }, { status: 500 });
  }
}
