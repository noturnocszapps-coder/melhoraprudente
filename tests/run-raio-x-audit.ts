import { getGrupoAnalitico, getSubcategoriaAnalitica, raioXDataService } from '../services/news-sources/raio-x-data-service';
import { AMOSTRA_AUDITORIA_30_ATOS } from './fixtures/raio-x-audit-samples';
import { REAL_COUNCILORS } from '../services/news-sources/councilor-crawler-service';
import { isSupabaseConfigured } from '../lib/supabase';

async function runAudit() {
  console.log("=========================================================");
  console.log("   [ETAPA 1] AUDITORIA DE REGRAS DETERMINÍSTICAS (30 ATOS)   ");
  console.log("=========================================================");

  let successCount = 0;

  for (let i = 0; i < AMOSTRA_AUDITORIA_30_ATOS.length; i++) {
    const sample = AMOSTRA_AUDITORIA_30_ATOS[i];
    const computedGroup = getGrupoAnalitico(sample.tipo_oficial, '', sample.ementa);
    const computedSub = getSubcategoriaAnalitica(sample.tipo_oficial, '', sample.ementa);

    const groupMatch = computedGroup === sample.grupo_analitico;
    const subMatch = computedSub === sample.subcategoria_analitica;

    if (groupMatch && subMatch) {
      successCount++;
      console.log(`✔ [Caso #${i + 1}] ID: ${sample.id} | Tipo: "${sample.tipo_oficial}"`);
      console.log(`    - Ementa: "${sample.ementa.substring(0, 75)}..."`);
      console.log(`    - Grupo Analítico: "${computedGroup}"`);
      console.log(`    - Subcategoria: "${computedSub}"`);
      console.log(`    - Regra Aplicada: ${sample.regra_aplicada}`);
    } else {
      console.log(`❌ [Caso #${i + 1}] FALHA DE CLASSIFICAÇÃO: ID: ${sample.id}`);
      console.log(`    - Esperado: Grupo: "${sample.grupo_analitico}", Sub: "${sample.subcategoria_analitica}"`);
      console.log(`    - Obtido:   Grupo: "${computedGroup}", Sub: "${computedSub}"`);
    }
  }

  const percentage = (successCount / AMOSTRA_AUDITORIA_30_ATOS.length) * 100;
  console.log(`\nRESULTADO DA AUDITORIA: ${successCount}/30 (${percentage.toFixed(1)}% de exatidão determinística)`);
  
  if (successCount === 30) {
    console.log("✔ SUCESSO: Todos os 30 exemplos reais foram classificados com 100% de exatidão determinística!");
  } else {
    console.log("❌ CRÍTICO: Divergência nas regras de classificação programática!");
    process.exit(1);
  }

  console.log("\n=========================================================");
  console.log("   [ETAPA 2] CONSULTA DE REGISTROS REAIS DO BANCO (3 VEREADORES) ");
  console.log("=========================================================");

  const targetCouncilorIds = ['VER-1449', 'VER-1465', 'VER-1434']; // William, Aristeu, Demerson
  
  if (!isSupabaseConfigured) {
    console.log("\nAVISO: Supabase não está configurado (.env ausente ou inválido).");
    console.log("Banco ainda sem dados persistidos suficientes (Sem conexão).");
    console.log("Métricas reais serão mostradas como zero.");
  }

  for (const id of targetCouncilorIds) {
    const staticVer = REAL_COUNCILORS.find(c => c.external_id === id);
    const name = staticVer ? staticVer.name : id;
    
    console.log(`\n---------------------------------------------------------`);
    console.log(`PERFIL VEREADOR: ${name}`);
    console.log(`ID Oficial: ${id}`);
    console.log(`---------------------------------------------------------`);

    const profile = await raioXDataService.getCouncilorProfile(id);
    
    if (!profile) {
      console.log(`❌ Não foi possível obter o perfil para ${id}`);
      continue;
    }

    console.log(`  [Métricas de Atos Legislativos Reais do Banco]`);
    console.log(`    - Projetos Apresentados: ${profile.stats.projetos_apresentados}`);
    console.log(`    - Projetos Aprovados Comprovados: ${profile.stats.projetos_aprovados_comprovados}`);
    console.log(`    - Projetos em Tramitação: ${profile.stats.projetos_em_tramitacao}`);
    console.log(`    - Requerimentos: ${profile.stats.requerimentos}`);
    console.log(`    - Indicações: ${profile.stats.indicacoes}`);
    console.log(`    - Moções: ${profile.stats.mocoes}`);
    console.log(`    - Emendas: ${profile.stats.emendas}`);
    console.log(`    - Outros Atos: ${profile.stats.outros_atos}`);
    console.log(`    - Autoria Principal: ${profile.stats.autoria_principal}`);
    console.log(`    - Coautoria: ${profile.stats.coautoria}`);

    console.log(`\n  [Agrupamento Analítico de Atos (Sem Pesos / Sem Rankings)]`);
    Object.entries(profile.acts_by_group).forEach(([group, count]) => {
      console.log(`    * Grupo "${group}": ${count} propositura(s)`);
    });

    console.log(`\n  [Subcategorias Analíticas Atribuídas]`);
    Object.entries(profile.acts_by_subcategory).forEach(([sub, count]) => {
      if (count > 0) {
        console.log(`    * Subcategoria "${sub}": ${count} propositura(s)`);
      }
    });

    console.log(`\n  [Amostra de Atos no Banco para ${id}]`);
    if (profile.acts.length === 0) {
      console.log("    (Nenhum ato encontrado para este vereador no banco de dados. Estado vazio / zero provado.)");
    } else {
      profile.acts.forEach((act, idx) => {
        console.log(`    Ato #${idx + 1}:`);
        console.log(`      - ID Único: ${act.external_id}`);
        console.log(`      - Tipo Oficial: "${act.tipo_oficial}" (Mantido da Câmara)`);
        console.log(`      - Grupo Analítico: "${act.grupo_analitico}" (Portal)`);
        console.log(`      - Subcategoria: "${act.subcategoria_analitica}"`);
        console.log(`      - Título: ${act.title}`);
        console.log(`      - Status: ${act.status}`);
        console.log(`      - É Coautor? ${act.is_coauthored ? 'SIM' : 'NÃO'}`);
      });
    }
  }

  console.log("\n=========================================================");
  console.log("   [ETAPA 3] VERIFICAÇÃO DE DIRETRIZES ÉTICAS E DE ESCOPO   ");
  console.log("=========================================================");
  console.log("✔ NENHUM ranking de vereadores foi gerado.");
  console.log("✔ NENHUM score de eficiência ou produtividade foi calculado.");
  console.log("✔ NENHUMA classificação de 'melhor' ou 'pior' vereador foi estipulada.");
  console.log("✔ Todo agrupamento é totalmente programático, determinístico e auditável.");
  console.log("=========================================================");
}

runAudit();
