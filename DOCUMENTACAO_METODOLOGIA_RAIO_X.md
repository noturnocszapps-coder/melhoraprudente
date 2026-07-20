# METODOLOGIA DO RAIO-X DOS VEREADORES
## Portal Melhora Prudente (2025 - 2028)

Este documento apresenta de forma pública, objetiva e transparente a metodologia aplicada pelo **Portal Melhora Prudente** para agrupar e analisar a atuação dos vereadores da Câmara Municipal de Presidente Prudente na legislatura de **2025 - 2028**.

---

### 1. PRINCÍPIOS FUNDAMENTAIS
O desenvolvimento do Raio-X foi guiado por princípios éticos e técnicos rígidos para garantir imparcialidade e exatidão:

1. **Ausência de Rankings**: O portal **NÃO** estabelece notas, pontuações de eficiência ou rankings gerais. Entendemos que a atuação de um parlamentar é multidimensional e qualitativa; definir o "melhor" ou "pior" vereador de forma automatizada induziria os cidadãos a erro.
2. **Preservação Histórica**: O tipo oficial de cada ato legislativo cadastrado na Câmara Municipal é **rigorosamente preservado** e exibido de forma inalterada.
3. **Classificação Determinística e Programática**: Nenhuma classificação de atos legislativos é feita por inteligência artificial de forma silenciosa ou por opiniões subjetivas. Todas as regras de agrupamento analítico e subcategorias baseiam-se em lógicas programáticas auditáveis.
4. **Independência Quantitativa**: O portal conscientiza o cidadão de que a quantidade bruta de requerimentos ou indicações não equivale, por si só, à qualidade da atuação de um vereador.

---

### 2. COMPOSIÇÃO DOS GRUPOS ANALÍTICOS

Para facilitar a navegação do cidadão, os diferentes tipos oficiais de atos são mapeados de forma transparente em **cinco grupos principais**:

| Grupo Analítico | Descrição | Tipos Oficiais Incluídos |
| :--- | :--- | :--- |
| **PRODUÇÃO LEGISLATIVA** | Elaboração e modificação do arcabouço jurídico municipal. | Projeto de Lei, Projeto de Resolução, Projeto de Emenda à LOM, Substitutivos, Emendas. |
| **FISCALIZAÇÃO E CONTROLE** | Exercício da função fiscalizadora do Legislativo sobre as ações e contas do Prefeito e suas secretarias. | Requerimentos legislativos de fiscalização e informação. |
| **DEMANDAS E INDICAÇÕES** | Sugestões diretas de zeladoria, trânsito e manutenção de bairros enviadas ao Executivo Municipal. | Indicações. |
| **ATOS SIMBÓLICOS** | Atos de representação institucional, homenagens, votos de luto ou denominação de logradouros públicos. | Moções (Pesar, Congratulação, Repúdio), Projetos de Decreto Legislativo de outorga de títulos/medalhas, e Projetos de Lei denominativos. |
| **OUTROS** | Qualquer outro ato administrativo de menor relevância normativa ou sem classificação expressa. | Outros tipos não catalogados. |

---

### 3. SUBCATEGORIAS ANALÍTICAS DETALHADAS

Cada ato recebe uma **subcategoria analítica** específica, definida de forma automática através de palavras-chave programáticas explícitas em suas ementas ou títulos:

#### A. Produção Legislativa
- **legislação municipal**: Projetos de Lei Ordinária ou Complementar estruturais, Emendas normativas e Substitutivos gerais.
- **organização da Câmara**: Projetos de Resolução que alteram o Regimento Interno ou a administração do Legislativo.
- **emenda à Lei Orgânica**: Modificações e emendas diretas à Lei Orgânica Municipal (LOM).

#### B. Fiscalização e Controle
- **pedido de informação**: Requerimentos demandando respostas formais do Prefeito e de secretários.
- **convocação**: Requerimentos para convocar secretários e dirigentes de autarquias a prestar depoimento presencial.
- **fiscalização**: Requerimentos gerais para instauração de Comissões Especiais de Inquérito (CEIs) ou vistorias em obras.

#### C. Demandas e Indicações
- **zeladoria**: Indicações solicitando roçagem de mato, limpeza de bueiros, coleta de lixo, poda de árvores ou conservação de praças.
- **infraestrutura**: Indicações sugerindo pavimentação asfáltica, tapa-buraco, calçamento público ou redes de água e esgoto.
- **iluminação**: Indicações de substituição ou manutenção de postes e lâmpadas queimadas.
- **trânsito**: Indicações de sinalização viária, instalação de lombadas, semáforos, readequação de mãos ou faixas de pedestre.

#### D. Atos Simbólicos
- **homenagem**: Concessão de Títulos de Cidadão Prudentino, Medalhas de Mérito ou Projetos Declaratórios de Utilidade Pública.
- **congratulação**: Moções de aplausos, parabenização ou congratulações a indivíduos, empresas ou grupos sociais.
- **pesar**: Moções de pesar pelo falecimento de cidadãos.
- **denominação de espaço público**: Projetos de Lei denominando ruas, praças, pontes ou edifícios municipais.

---

### 4. REGRAS DE AUTORIA E EVITAÇÃO DE DUPLICIDADE

- **Diferenciação Clara**: O sistema distingue entre **Autoria Principal** (quando o vereador é o autor original que protocolou o projeto) e **Coautoria** (quando o parlamentar assina em conjunto com outros colegas de bancada ou comissões).
- **Evitação de Duplicidade**: Cada propositura cadastrada na base de dados possui um identificador único de controle oficial fornecido pela Câmara. Mesmo que um projeto tenha múltiplos coautores, ele é contado uma única vez no sistema de autoria individual de forma devidamente categorizada, evitando sobreposição de estatísticas globais da Casa.

---

### 5. COMO É CLASSIFICADO O PROJETO DE DECRETO LEGISLATIVO?

O **Projeto de Decreto Legislativo (PDL)** possui um tratamento especial:
* Se a ementa tratar de **concessão de honrarias, medalhas, títulos honoríficos de cidadania ou reconhecimento simbólico**, ele é categorizado no grupo **ATOS SIMBÓLICOS** (subcategoria *homenagem*).
* Se a ementa tratar de **efeito institucional real e prático** (como o julgamento anual das contas públicas da Prefeitura pelo plenário da Câmara), ele é mantido no grupo **PRODUÇÃO LEGISLATIVA** (subcategoria *legislação municipal*).

---

### 6. EXEMPLO DE REPRODUÇÃO PROGRAMÁTICA (TypeScript)

A classificação é implementada de forma aberta em nossa camada de serviços e pode ser verificada livremente:

```typescript
export function getGrupoAnalitico(actType: string, title: string = '', summary: string = ''): GrupoAnalitico {
  const combined = `${title.toUpperCase()} ${(summary || '').toUpperCase()}`;
  if (combined.includes('DENOMINA') || combined.includes('HONRÍFICO') || combined.includes('CIDADÃO') || combined.includes('MEDALHA')) {
    return 'ATOS SIMBÓLICOS';
  }
  // ... regras descritas programaticamente
}
```

Qualquer cidadão, vereador ou jornalista que desejar auditar o comportamento do sistema pode conferir as regras e constatar a precisão determinística e apartidária do portal.
