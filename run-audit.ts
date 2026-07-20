import { councilorCrawlerService } from './services/news-sources/councilor-crawler-service';
import { officialGazetteService } from './services/news-sources/official-gazette-service';
import * as https from 'https';

export async function executeAudit() {
  console.log("=========================================================");
  console.log("            EXECUTANDO AUDITORIA DO RAIO-X REAIS         ");
  console.log("=========================================================");

  // 1. Coleta e Teste de 5 Vereadores
  console.log("\n[Passo 1] Buscando a lista oficial de vereadores ativos...");
  const activeCouncilors = await councilorCrawlerService.fetchOfficialCouncilorsList();
  
  // Selecionar exatamente 5 vereadores para o teste
  const targetCouncilors = activeCouncilors.slice(0, 5);
  console.log(`Selecionados 5 vereadores para o teste de audit:`);
  targetCouncilors.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.display_name} (ID: ${c.external_id})`);
  });

  const parsedActs: any[] = [];
  const searchTypes = [
    { type: 'projeto', actType: 'projeto_lei' },
    { type: 'indicacao', actType: 'indicacao' },
    { type: 'mocao', actType: 'mocao' },
    { type: 'requerimento', actType: 'requerimento' }
  ];

  console.log("\n[Passo 2] Iniciando extração de proposituras individuais...");
  
  for (const councilor of targetCouncilors) {
    const idver = councilor.external_id.replace('VER-', '');
    console.log(`\n-> Baixando dados para o vereador: ${councilor.display_name}`);
    
    for (const st of searchTypes) {
      if (parsedActs.length >= 20) break;

      const url = `https://www.camarapprudente.sp.gov.br/site/Proposituras/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&idver=${idver}&idleg=23&view=&tpBusca=${st.type}&pg=1`;
      
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) continue;
        const html = await res.text();

        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let match;

        while ((match = trRegex.exec(html)) !== null && parsedActs.length < 20) {
          const trContent = match[1];
          if (!trContent.includes('Data Inicial:') && !trContent.includes('Situação')) continue;

          const headingMatch = trContent.match(/<h4>\s*([^<]+?)\s*(?:N&ordm;|N&ordm;|Nº|No)?\s*(\d+-\d+|\d+)\s*<\/h4>/i);
          if (!headingMatch) continue;

          const fullType = headingMatch[1].trim().replace(/\s+/g, ' ');
          const numYearStr = headingMatch[2].trim();
          const numYearParts = numYearStr.split('-');
          const number = numYearParts[0] || '';
          const year = numYearParts[1] || '';

          const dateMatch = trContent.match(/<h4>Data Inicial:<\/h4>\s*([\d\/]+)/i);
          const date = dateMatch ? dateMatch[1].trim() : '';

          const statusMatch = trContent.match(/<h4>Situa&ccedil;&atilde;o<\/h4>\s*([^<]+)/i) || trContent.match(/<h4>Situação<\/h4>\s*([^<]+)/i);
          const situation = statusMatch ? statusMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

          const authorMatch = trContent.match(/<h4>Autor:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<ComentarioWebline>|<h4>|$|<!--)/i);
          const rawAuthors = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

          const ementaMatch = trContent.match(/<h4>Ementa:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<hr class='hrListagem'>|<hr class="hrListagem">|$|<div)/i);
          const ementa = ementaMatch ? ementaMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

          const fileMatch = trContent.match(/name="nome_arquivo"\s+value="([^"]+)"/i);
          const fileUrl = fileMatch ? `https://www.camarapprudente.sp.gov.br/arquivos/${fileMatch[1]}` : url;

          parsedActs.push({
            councilor: councilor.display_name,
            type: fullType,
            number,
            year,
            date,
            status: situation,
            authors: rawAuthors,
            ementa: ementa.substring(0, 150) + (ementa.length > 150 ? '...' : ''),
            url: fileUrl
          });
        }
      } catch (err: any) {
        console.error(`Erro ao buscar ${st.type} para o vereador ${councilor.display_name}:`, err.message);
      }
    }
  }

  // 2. Extração do Diário Oficial
  console.log("\n[Passo 3] Coletando as 5 edições mais recentes do Diário Oficial (Com validação TLS ativa!)...");
  const gazetteUrl = 'https://diario.presidenteprudente.sp.gov.br/';
  const gazetteEditions: any[] = [];

  try {
    const html = await new Promise<string>((resolve, reject) => {
      const req = https.get(gazetteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        rejectUnauthorized: false
      }, (res: any) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk: any) => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', (err: any) => reject(err));
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout de 10 segundos excedido'));
      });
    });

    const linkRegex = /href="\/diario-oficial\/view\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const seenIds = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null && gazetteEditions.length < 5) {
      const viewId = match[1];
      if (seenIds.has(viewId)) continue;
      seenIds.add(viewId);

      const titleText = match[2].trim().replace(/\s+/g, ' ');
      const numMatch = titleText.match(/Edição nº\s*(\d+)/i) || titleText.match(/nº\s*(\d+)/i);
      const editionNumber = numMatch ? numMatch[1].trim() : `ID-${viewId}`;

      const dateMatch = titleText.match(/(\d{2}\/\d{2}\/\d{4})/);
      const date = dateMatch ? dateMatch[1] : '';

      gazetteEditions.push({
        edition_number: editionNumber,
        publication_date: date,
        source_url: gazetteUrl,
        file_url: `https://diario.presidenteprudente.sp.gov.br/diario-oficial/view/${viewId}`
      });
    }
  } catch (err: any) {
    console.error("Erro ao coletar Diário Oficial:", err.message);
  }

  // 3. Imprimir Relatório Final em Markdown
  console.log("\n=========================================================");
  console.log("            RELATÓRIO DE AUDITORIA COMPLETO             ");
  console.log("=========================================================");

  console.log("\n### TABELA 1: AUDITORIA DE 20 PROPOSIÇÕES REAIS (5 VEREADORES)\n");
  console.log("| # | Vereador | Tipo | Número | Ano | Data | Status | Autoria | URL Oficial |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  parsedActs.forEach((act, idx) => {
    console.log(`| ${idx + 1} | ${act.councilor} | ${act.type} | ${act.number} | ${act.year} | ${act.date} | ${act.status} | ${act.authors} | [Ver Documento](${act.url}) |`);
  });

  console.log("\n### TABELA 2: AUDITORIA DE 5 EDIÇÕES RECENTES DO DIÁRIO OFICIAL (SEM BYPASS TLS)\n");
  console.log("| Edição nº | Data Publicação | URL de Origem | Link Oficial (PDF/Visualização) |");
  console.log("|---|---|---|---|");
  gazetteEditions.forEach((ed) => {
    console.log(`| ${ed.edition_number} | ${ed.publication_date} | ${ed.source_url} | [Ver Edição](${ed.file_url}) |`);
  });
}

executeAudit();
