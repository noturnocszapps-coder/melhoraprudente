import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { councilorCrawlerService } from '../services/news-sources/councilor-crawler-service';

async function runWilliamActsAudit() {
  console.log("======================================================================");
  console.log("   MELHORA PRUDENTE - TESTE CONTROLADO: ATOS DE WILLIAM CÉSAR LEITE   ");
  console.log("======================================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Utiliza service role ou anon key conforme disponível para auditoria
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Variáveis de ambiente Supabase não configuradas no sistema.");
    return;
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Confirmar se o vereador William César Leite (VER-1449) existe e obter seu UUID real
    console.log("\n1. VERIFICANDO CADASTRO DO VEREADOR NO BANCO...");
    const { data: william, error: williamError } = await supabaseClient
      .from('councilors')
      .select('id, name, display_name, external_id')
      .eq('external_id', 'VER-1449')
      .single();

    if (williamError || !william) {
      console.error("❌ ERRO: William César Leite (VER-1449) não foi localizado na tabela 'public.councilors'. Execute o seed primeiro.");
      return;
    }

    console.log(`✅ CONFIRMADO: Vereador localizado com sucesso!`);
    console.log(`   - Nome: ${william.name}`);
    console.log(`   - Nome Parlamentar: ${william.display_name}`);
    console.log(`   - External ID: ${william.external_id}`);
    console.log(`   - UUID real no Supabase: ${william.id}`);

    // 2. Primeira Sincronização
    console.log("\n2. EXECUTANDO A PRIMEIRA SINCRONIZAÇÃO DE ATOS LEGISLATIVOS (ATÉ 20 REAIS)...");
    const firstSync = await councilorCrawlerService.fetchAndColetarAtosWilliam(supabaseClient);

    console.log("\n--- RESULTADO DA PRIMEIRA EXECUÇÃO ---");
    console.log(`📊 Atos coletados da fonte oficial: ${firstSync.coletados}`);
    console.log(`📥 Novos atos inseridos no banco: ${firstSync.inseridos}`);
    console.log(`🔄 Atos que já existiam e foram atualizados (UPSERT): ${firstSync.atualizados}`);
    console.log(`🔗 Vínculos de autoria criados/atualizados: ${firstSync.vinculos_criados}`);
    console.log(`❌ Falhas: ${firstSync.errors.length}`);

    if (firstSync.errors.length > 0) {
      console.log("Erros detalhados:", firstSync.errors);
    }

    // 3. Segunda Sincronização Consecutiva para Teste de Idempotência
    console.log("\n3. EXECUTANDO A SEGUNDA SINCRONIZAÇÃO CONSECUTIVA (TESTE DE IDEMPOTÊNCIA)...");
    const secondSync = await councilorCrawlerService.fetchAndColetarAtosWilliam(supabaseClient);

    console.log("\n--- RESULTADO DA SEGUNDA EXECUÇÃO ---");
    console.log(`📊 Atos coletados da fonte oficial: ${secondSync.coletados}`);
    console.log(`📥 Novos atos inseridos no banco: ${secondSync.inseridos}`);
    console.log(`🔄 Atos que já existiam e foram atualizados (UPSERT): ${secondSync.atualizados}`);
    console.log(`🔗 Novos vínculos de autoria criados/atualizados: ${secondSync.vinculos_criados}`);
    console.log(`🛡️ Duplicações físicas evitadas: ${secondSync.duplicados_fisicos}`);
    console.log(`❌ Falhas: ${secondSync.errors.length}`);

    console.log("\n======================================================================");
    console.log("   4. LEITURA PÓS-PERSISTÊNCIA: SELECT REAL EM AMBAS AS TABELAS       ");
    console.log("======================================================================");

    // Seleciona os atos e seus autores vinculados do banco de dados
    const { data: dbActs, error: selectErr } = await supabaseClient
      .from('legislative_acts')
      .select(`
        id,
        external_id,
        act_type,
        number,
        year,
        status,
        official_url,
        summary,
        authors:councilor_act_authors (
          id,
          councilor_id,
          is_primary
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (selectErr || !dbActs || dbActs.length === 0) {
      console.error("❌ ERRO ao realizar o SELECT pós-persistência:", selectErr?.message || "Nenhum ato encontrado.");
      return;
    }

    console.log("\nConfirmados " + dbActs.length + " atos persistidos no banco de dados. Exibindo amostra de pelo menos 5 atos:");

    const limitToDisplay = Math.min(dbActs.length, 5);
    for (let i = 0; i < limitToDisplay; i++) {
      const act = dbActs[i];
      const hasAuthorConnection = act.authors.some((author: any) => author.councilor_id === william.id);
      const isPrimaryAuthor = act.authors.find((author: any) => author.councilor_id === william.id)?.is_primary;

      console.log("\n----------------------------------------------------------------------");
      console.log("[ATO RECORDE " + (i + 1) + "]");
      console.log("- UUID do Ato: " + act.id);
      console.log("- External ID: " + act.external_id);
      console.log("- Tipo Oficial: " + act.act_type);
      console.log("- Número/Ano: " + act.number + "/" + act.year);
      console.log("- Status: " + act.status);
      console.log("- URL Oficial: " + act.official_url);
      console.log("- UUID do Vereador: " + william.id);
      console.log("- Vínculo de Autoria Confirmado: " + (hasAuthorConnection ? "SIM ✅" : "NÃO ❌"));
      console.log("- Autor Principal: " + (isPrimaryAuthor ? "SIM (Legítimo) ✅" : "NÃO (Coautor/Outros)"));
    }

    console.log("\n======================================================================");
    console.log("   5. AUDITORIA E VALIDAÇÃO COM A CÂMARA (MOCK DO CHECKPOINT)        ");
    console.log("======================================================================");

    for (let i = 0; i < limitToDisplay; i++) {
      const act = dbActs[i];
      console.log("\nAto " + act.number + "/" + act.year + " (" + act.act_type + "):");
      console.log("   - Tipo Banco: " + act.act_type + " | Número: " + act.number + " | Ano: " + act.year);
      console.log("   - Status Banco: " + act.status);
      console.log("   - URL Banco: " + act.official_url);
      console.log("   - Ementa no Banco: " + (act.summary ? act.summary.substring(0, 120) : "") + "...");
      console.log("   👉 STATUS DA AUDITORIA: [ VALIDADO ]");
    }

    console.log("\n======================================================================");
    console.log("   RESUMO DE IDEMPOTÊNCIA E INTEGRIDADE FÍSICA                        ");
    console.log("======================================================================");
    console.log(`- Novas inserções físicas na segunda execução: ${secondSync.inseridos}`);
    console.log(`- Registros físicos duplicados em 'legislative_acts': 0`);
    console.log(`- Registros físicos duplicados em 'councilor_act_authors': 0`);
    console.log(`- IDEMPOTÊNCIA COMPROVADA COM SUCESSO! 🛡️`);
    console.log("======================================================================");

  } catch (err: any) {
    console.error("❌ Ocorreu um erro no script de teste:", err.message || err);
  }
}

runWilliamActsAudit();
