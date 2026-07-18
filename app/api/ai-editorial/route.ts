import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { supabase, getAuthedSupabaseClient } from "@/lib/supabase";

// Initialize Gemini client server-side
// User-Agent: aistudio-build is added to telemetry headers
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});

export async function POST(req: NextRequest) {
  try {
    // Validate Authorization / Role on the server-side
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[ai-editorial] Cabeçalho Authorization ausente ou inválido.");
      return NextResponse.json(
        { success: false, error: "Não autorizado. Token de autenticação ausente." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const client = getAuthedSupabaseClient(token);
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      console.warn("[ai-editorial] Erro ao validar token no Supabase Auth:", authError);
      return NextResponse.json(
        { success: false, error: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const userEmail = user.email?.toLowerCase().trim() || "";
    const userIdMasked = `${user.id.substring(0, 8)}...`;
    console.log(`[ai-editorial] Usuário autenticado com sucesso. ID: ${userIdMasked}, Email: ${userEmail}`);

    // Consulta padrão do perfil no banco com o cliente autenticado sob o RLS do usuário
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.warn(`[ai-editorial] Perfil não encontrado no banco de dados para ID: ${userIdMasked}.`);
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado. Perfil de usuário não encontrado." },
        { status: 403 }
      );
    }

    console.log(`[ai-editorial] Status do perfil: role=${profile.role}, status=${profile.status}`);

    if (profile.status === "blocked" || profile.status === "suspended") {
      console.warn(`[ai-editorial] Usuário ${userEmail} com conta suspensa ou bloqueada.`);
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado. Sua conta está suspensa ou bloqueada." },
        { status: 403 }
      );
    }

    if (profile.role !== "admin" && profile.role !== "editor") {
      console.warn(`[ai-editorial] Usuário ${userEmail} tentou acesso sem privilégios. Role: ${profile.role}`);
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Título e Conteúdo são obrigatórios para análise." },
        { status: 400 }
      );
    }

    // Guard if API Key is not set yet, return realistic mock AI payload so app doesn't break
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Returning highly realistic mock AI classification.");
      
      const isNacional = title.toLowerCase().includes("brasil") || title.toLowerCase().includes("nacional") || title.toLowerCase().includes("senado") || title.toLowerCase().includes("selic");
      const isBreaking = title.toUpperCase().includes("PLANTÃO") || title.toUpperCase().includes("URGENTE") || content.length < 500;
      
      let city_slug = "nacional";
      let city_name = "Nacional";
      if (!isNacional) {
        if (title.toLowerCase().includes("rio")) {
          city_slug = "rio-de-janeiro";
          city_name = "Rio de Janeiro";
        } else if (title.toLowerCase().includes("brasilia")) {
          city_slug = "brasilia";
          city_name = "Brasília";
        } else if (title.toLowerCase().includes("são paulo") || title.toLowerCase().includes("sao paulo")) {
          city_slug = "sao-paulo";
          city_name = "São Paulo";
        } else {
          city_slug = "presidente-prudente";
          city_name = "Presidente Prudente";
        }
      }

      return NextResponse.json({
        city_slug,
        city_name,
        category: title.toLowerCase().includes("futebol") || title.toLowerCase().includes("vence") ? "Esportes" : "Geral",
        is_breaking: isBreaking,
        ai_summary: content.substring(0, 180) + "...",
        ai_seo_title: title.substring(0, 55) + " | Portal de Notícias",
        ai_seo_description: content.substring(0, 150),
        relevance_score: Math.floor(Math.random() * 40) + 60,
        viral_potential_score: Math.floor(Math.random() * 50) + 50,
        regional_impact_score: city_slug === "nacional" ? 40 : 85
      });
    }

    const systemInstruction = `Você é um robô de Inteligência Editorial de uma rede de mídia nacional brasileira nível G1, GloboNews e UOL.
Analise o título e conteúdo fornecidos e retorne obrigatoriamente um objeto JSON com a classificação, resumo SEO e as métricas exatas de impacto.

Regras de Classificação de Cidades:
- "presidente-prudente" (Nome: "Presidente Prudente"): se a notícia for local, mencionar Presidente Prudente, oeste paulista ou eventos especificamente prudentinos.
- "sao-paulo" (Nome: "São Paulo"): se for sobre a capital paulista ou estado de SP em geral.
- "rio-de-janeiro" (Nome: "Rio de Janeiro"): se for sobre a capital fluminense ou estado do RJ.
- "brasilia" (Nome: "Brasília"): se for sobre o DF ou política nacional concentrada no planalto.
- "nacional" (Nome: "Nacional"): se for uma notícia de impacto amplo em todo o Brasil (economia nacional, decisões federais, esportes nacionais, etc).

Regras de Categoria:
Escolha obrigatoriamente uma destas: "Cidade", "Política", "Segurança", "Esportes", "Cultura", "Geral", "Economia", "Tecnologia", "Mundo".

Detecção de Breaking News:
Marque "is_breaking" como true se o assunto for urgente, um fato recente de altíssima relevância imediata ou contenha gatilhos como PLANTÃO, URGENTE, ACIDENTE GRAVE, DECISÃO LIMINAR.

Geração de Resumo:
Crie um resumo elegante de 1-2 frases destacando os fatos principais em português formal do Brasil.

SEO:
- ai_seo_title: título amigável para motores de busca com no máximo 60 caracteres.
- ai_seo_description: meta description para Google com no máximo 155 caracteres.

Scores (retorne valores inteiros de 0 a 100):
- relevance_score: importância jornalística da notícia.
- viral_potential_score: chance de compartilhamento em redes sociais.
- regional_impact_score: o nível de impacto local para aquela cidade específica (notícias nacionais têm impacto local menor, notícias hiperlocais têm impacto local altíssimo de 80-100 na cidade delas).`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        city_slug: {
          type: Type.STRING,
          enum: ["presidente-prudente", "sao-paulo", "rio-de-janeiro", "brasilia", "nacional"],
          description: "Slug da cidade detectada ou nacional"
        },
        city_name: {
          type: Type.STRING,
          enum: ["Presidente Prudente", "São Paulo", "Rio de Janeiro", "Brasília", "Nacional"],
          description: "Nome formatado da cidade ou Nacional"
        },
        category: {
          type: Type.STRING,
          enum: ["Cidade", "Política", "Segurança", "Esportes", "Cultura", "Geral", "Economia", "Tecnologia", "Mundo"],
          description: "Categoria editorial"
        },
        is_breaking: {
          type: Type.BOOLEAN,
          description: "Se é breaking news urgente"
        },
        ai_summary: {
          type: Type.STRING,
          description: "Resumo jornalístico curto"
        },
        ai_seo_title: {
          type: Type.STRING,
          description: "Título otimizado para SEO"
        },
        ai_seo_description: {
          type: Type.STRING,
          description: "Descrição otimizada para SEO"
        },
        relevance_score: {
          type: Type.INTEGER,
          description: "Pontuação de relevância (0-100)"
        },
        viral_potential_score: {
          type: Type.INTEGER,
          description: "Potencial de viralização (0-100)"
        },
        regional_impact_score: {
          type: Type.INTEGER,
          description: "Impacto regional local (0-100)"
        }
      },
      required: [
        "city_slug",
        "city_name",
        "category",
        "is_breaking",
        "ai_summary",
        "ai_seo_title",
        "ai_seo_description",
        "relevance_score",
        "viral_potential_score",
        "regional_impact_score"
      ]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Análise esta notícia:\nTítulo: ${title}\nConteúdo:\n${content}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia da IA.");
    }

    const aiData = JSON.parse(responseText.trim());
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("Erro na rota de Inteligência Editorial:", error);
    return NextResponse.json(
      { error: "Erro ao processar análise editorial com a IA: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const client = getAuthedSupabaseClient(token);
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Sessão inválida." },
        { status: 401 }
      );
    }

    // Verify profile role
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      return NextResponse.json(
        { success: false, error: "Acesso proibido." },
        { status: 403 }
      );
    }

    const isApiKeySet = typeof process.env.GEMINI_API_KEY === 'string' && process.env.GEMINI_API_KEY.length > 0;
    return NextResponse.json({
      success: true,
      api_configured: isApiKeySet
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
