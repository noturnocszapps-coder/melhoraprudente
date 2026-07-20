import { councilorCrawlerService } from '../services/news-sources/councilor-crawler-service';

async function testSingleCouncilorFlow() {
  console.log("=== INICIANDO FLUXO CONTROLADO DE UM VEREADOR (TESTE DE COLETA REAL) ===");
  const urlProposituras = 'https://www.camarapprudente.sp.gov.br/site/Proposituras/';
  console.log(`1. Acessando a Câmara Municipal oficial em tempo real: ${urlProposituras}...`);
  
  try {
    // Roda a coleta oficial real em tempo real
    const officialList = await councilorCrawlerService.fetchOfficialCouncilorsList();
    
    if (officialList.length === 0) {
      console.error("❌ ERRO: Nenhum vereador foi extraído do site da Câmara.");
      return;
    }
    
    // Buscar especificamente o vereador William César Leite (VER-1449)
    const targetCouncilor = officialList.find(c => c.external_id === 'VER-1449');
    
    console.log(`\n2. Resultado da coleta em tempo real:`);
    console.log(`   - Total de vereadores encontrados: ${officialList.length}`);
    
    if (targetCouncilor) {
      console.log(`   - Vereador de teste (WILLIAM CÉSAR LEITE) foi ENCONTRADO na listagem em tempo real!`);
      console.log(`     * ID Externo: ${targetCouncilor.external_id}`);
      console.log(`     * Nome completo: ${targetCouncilor.name}`);
      console.log(`     * Partido: ${targetCouncilor.party}`);
      console.log(`     * Foto: ${targetCouncilor.photo_url}`);
      console.log(`     * Página Oficial: ${targetCouncilor.official_url}`);
    } else {
      console.log(`   - Vereador WILLIAM CÉSAR LEITE não foi encontrado na listagem viva atual (usando dados de backup).`);
      const backupList = require('../services/news-sources/councilor-crawler-service').REAL_COUNCILORS;
      const backupTarget = backupList.find((c: any) => c.external_id === 'VER-1449');
      if (backupTarget) {
        console.log(`     * ID Externo: ${backupTarget.external_id}`);
        console.log(`     * Nome completo: ${backupTarget.name}`);
        console.log(`     * Partido: ${backupTarget.party}`);
        console.log(`     * Foto: ${backupTarget.photo_url}`);
      }
    }

    console.log(`\n======================================================================`);
    console.log(`3. ARQUITETURA DE SEGURANÇA E PERSISTÊNCIA REAL COM RLS`);
    console.log(`======================================================================`);
    console.log(`- Para proteger a integridade do projeto "Melhora Prudente", nenhuma gravação anônima`);
    console.log(`  ou usuário falso/fictício com bypass automático é permitido.`);
    console.log(`- A persistência real no Supabase deve ser feita de forma legítima e segura.`);
    console.log(`\n👉 COMO EXECUTAR O TESTE DE PERSISTÊNCIA REAL COM SUCESSO:`);
    console.log(`   1. Faça login como Administrador ou Editor real no painel administrativo.`);
    console.log(`   2. Acesse a página do módulo Raio-X dos Vereadores: /admin/vereadores`);
    console.log(`   3. Clique no botão de sincronização "Coletar e Analisar Atos".`);
    console.log(`   4. O painel enviará seu JWT legítimo para a API Route protegida (/api/admin/vereadores).`);
    console.log(`   5. O servidor coletará WILLIAM CÉSAR LEITE, executará um UPSERT autenticado,`);
    console.log(`      realizará um SELECT de verificação pós-persistência e confirmará o sucesso.`);
    console.log(`\n✅ O código do servidor (API Route) já está preparado para esta validação controlada!`);
    console.log(`======================================================================`);

  } catch (err: any) {
    console.error("❌ Erro durante o teste de coleta:", err.message || err);
  }
}

testSingleCouncilorFlow();
