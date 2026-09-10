---
name: seven-personas-audit
description: Realiza uma auditoria completa do projeto simulando 7 personas técnicas independentes (segurança, arquitetura backend, DevOps/infra, frontend/UX, QA/testes, dados, produto/negócio), cada uma revisando o sistema pela sua lente, e consolida tudo em um relatório .txt com pontos críticos, fracos e a melhorar, incluindo o porquê de cada item precisar de atualização. Use quando o usuário pedir uma "auditoria completa", "revisão geral do sistema", "revisão com múltiplas perspectivas/personas", "auditoria 360", ou revisão de ponta a ponta do projeto com relatório final em arquivo.
---

# Auditoria com 7 Personas

Metodologia para simular uma banca de 7 especialistas revisando o sistema, cada um sob uma lente diferente, terminando em um relatório consolidado em `.txt`.

## Passo 1 — Levantamento inicial (feito por você, não pelos agentes)

Antes de convocar as personas, mapeie o projeto rapidamente:
- Stack real (backend, frontend, banco de dados, infra) via `package.json`, `docker-compose.yml`, estrutura de pastas.
- Arquivos de configuração e segredos (`.env*`, chaves, connection strings) e se estão versionados (`git ls-files | grep env`, `git check-ignore`).
- Estrutura de módulos/rotas principais.

Isso evita que as personas percam tempo redescobrindo o óbvio e permite calibrar o foco de cada uma ao stack real (ex.: se não houver testes, a persona QA já parte sabendo disso).

## Passo 2 — As 7 personas

Adapte o foco de cada persona ao stack real encontrado no Passo 1, mas mantenha a lente:

1. **🔐 Sentinela — Segurança / Pentester**
   Autenticação/autorização, segredos expostos ou versionados, validação de input, injeção (SQL/NoSQL/query), CORS, dependências vulneráveis, dados sensíveis (LGPD), logs vazando dados.

2. **🏗️ Arquiteto — Backend Sênior**
   Organização de camadas/módulos, acoplamento, duplicação, consistência de padrões, tratamento de erros, escalabilidade do design, dívida técnica.

3. **⚙️ Operador — DevOps / SRE**
   Dockerfiles, docker-compose, variáveis de ambiente, healthchecks, restart policies, observabilidade/logging, estratégia de deploy, resiliência a falhas, gestão de segredos em produção.

4. **🎨 Curador — Frontend / UX**
   Estrutura de componentes, gerenciamento de estado, responsividade, acessibilidade, tratamento de erros na UI, feedback ao usuário, performance de carregamento.

5. **🧪 Cético — QA / Testes**
   Cobertura de testes (unit/e2e), qualidade dos testes existentes, casos de borda não tratados, tratamento de exceções, resiliência a inputs inválidos/malformados.

6. **📊 Analista — Dados**
   Eficiência de queries, custo/performance (full scans, paginação, índices), modelagem de dados, integridade e consistência dos dados, performance em listas grandes.

7. **💼 Estrategista — Produto / Negócio**
   Completude de funcionalidades, usabilidade do fluxo ponta a ponta, alinhamento com o objetivo de negócio do sistema, lacunas de valor, prioridades.

## Passo 3 — Execução em paralelo

Dispare as 7 revisões como agentes independentes, **em uma única mensagem com 7 chamadas Agent em paralelo** (`run_in_background: false`, `subagent_type: "Explore"` ou `"general-purpose"` conforme a profundidade necessária).

Cada prompt de agente deve ser autocontido e incluir:
- Um resumo do stack/estrutura levantado no Passo 1 (o agente não tem esse contexto).
- A lente específica da persona (copie a descrição do Passo 2).
- Instrução explícita: **só reportar problemas realmente observados no código**, nunca supor ou inventar. Se nada crítico for encontrado, dizer isso honestamente.
- Pedir que cada achado venha com: título curto, severidade (`CRÍTICO` / `FRACO` / `A MELHORAR`), localização (`arquivo:linha` quando aplicável), descrição do problema, e **por que isso importa / por que deveria ser atualizado** (risco, custo, impacto no usuário, dívida técnica, etc).
- Limite de tamanho da resposta (ex. "liste no máximo 8 achados, priorize os mais relevantes").

## Passo 4 — Síntese

Depois que os 7 agentes retornarem:
- Leia todos os achados.
- Remova duplicatas/sobreposições entre personas (ex.: segredo versionado pode aparecer tanto no Sentinela quanto no Operador — mantenha uma vez, citando as duas perspectivas se relevante).
- Priorize: CRÍTICO primeiro, depois FRACO, depois A MELHORAR.
- Não amplifique nem suavize a severidade reportada pelos agentes sem justificativa — mas você pode rebaixar/reclassificar se, ao revisar, achar que a severidade original está errada.

## Passo 5 — Relatório final em .txt

Gere um arquivo `.txt` (não markdown) com esta estrutura:

```
RELATÓRIO DE AUDITORIA — [nome do projeto]
Data: [data]
Escopo: [pastas/módulos cobertos]
Personas envolvidas: Sentinela, Arquiteto, Operador, Curador, Cético, Analista, Estrategista

===================================================
RESUMO EXECUTIVO
===================================================
[Contagem por severidade + 2-4 frases sobre o estado geral do sistema]

===================================================
PONTOS CRÍTICOS
===================================================
[N]. [Título] — Persona: [nome]
   Localização: [arquivo:linha ou área]
   Problema: [descrição]
   Por que atualizar: [risco/impacto concreto]

===================================================
PONTOS FRACOS
===================================================
[mesmo formato]

===================================================
PONTOS A MELHORAR
===================================================
[mesmo formato]

===================================================
OBSERVAÇÕES POR PERSONA
===================================================
[Bloco curto por persona com o que cada uma achou, mesmo que já listado acima — dá rastreabilidade de quem viu o quê]
```

Salve o arquivo na raiz do projeto (ou onde o usuário pedir), com nome tipo `auditoria_[YYYY-MM-DD].txt`, e informe o caminho final ao usuário.

## Notas

- Esta skill é sobre **investigação e relatório**, não conserto. Não edite código durante a auditoria — apenas ao final, se o usuário pedir explicitamente para corrigir algo listado.
- Se o projeto for muito grande, é aceitável direcionar cada persona a um subconjunto (ex. Curador só olha `frontend/src`), desde que isso fique explícito no relatório em "Escopo".
