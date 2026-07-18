import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { garimpoService } from '@/services/news-sources/garimpo-service';

async function validateAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[validateAuth] Cabeçalho Authorization ausente ou inválido.");
    return { errorResponse: NextResponse.json({ success: false, error: "Não autorizado. Token de autenticação ausente." }, { status: 401 }) };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.warn("[validateAuth] Erro ao validar token no Supabase Auth:", authError);
    return { errorResponse: NextResponse.json({ success: false, error: "Sessão inválida ou expirada." }, { status: 401 }) };
  }

  const userEmail = user.email?.toLowerCase().trim() || "";
  const userIdMasked = `${user.id.substring(0, 8)}...`;
  console.log(`[validateAuth] Usuário autenticado com sucesso. ID: ${userIdMasked}, Email: ${userEmail}`);

  let profile: { role: string; status: string } | null = null;
  const isKnownAdmin = userEmail === 'contato.fh3@gmail.com' || userEmail.endsWith('@melhoraprudente.com.br');

  if (isKnownAdmin) {
    console.log(`[validateAuth] Usuário ${userEmail} identificado como Administrador Conhecido.`);
    profile = { role: 'admin', status: 'active' };

    // Tentativa auto-cicatrizante (self-healing) de criar ou atualizar o perfil no banco de dados,
    // de modo que futuras consultas diretas e RLS também passem a funcionar perfeitamente.
    try {
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Administrador Melhora Prudente',
        role: 'admin',
        status: 'active'
      }, { onConflict: 'id' });

      if (upsertError) {
        console.warn(`[validateAuth] Falha silenciosa ao upsertar perfil no banco (comum se houver RLS ativo):`, upsertError.message);
      } else {
        console.log(`[validateAuth] Perfil real de administrador persistido com sucesso no banco de dados para ${userEmail}.`);
      }
    } catch (err: any) {
      console.warn(`[validateAuth] Exceção silenciosa ao tentar persistir perfil de administrador:`, err.message || err);
    }
  } else {
    // Consulta padrão do perfil no banco
    const { data: dbProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !dbProfile) {
      console.warn(`[validateAuth] Perfil não encontrado no banco de dados para ID: ${userIdMasked}.`);
      return { errorResponse: NextResponse.json({ success: false, error: "Acesso não autorizado. Perfil de usuário não encontrado." }, { status: 403 }) };
    }
    profile = dbProfile;
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

  return { user, profile };
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID do candidato é obrigatório" }, { status: 400 });
    }

    const success = await garimpoService.rejectCandidate(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API Garimpo Reject] Erro:', error);
    return NextResponse.json({ error: "Erro ao rejeitar candidato: " + error.message }, { status: 500 });
  }
}
