# Senha Rápida

Jogo presencial de adivinhação de palavras para duas pessoas, feito com React, TypeScript, Vite, Tailwind CSS e Lucide. Não usa backend nem serviços externos: preferências, palavras recentes e histórico ficam no `localStorage` do navegador.

## Funcionalidades

- Partidas de 30, 60, 90 ou 120 segundos com 5, 10, 15 ou 20 palavras.
- 2.100 palavras brasileiras divididas em 10 categorias e 3 dificuldades.
- Sorteio Fisher–Yates que prioriza palavras inéditas e impede repetições enquanto houver opções elegíveis.
- Ciclos automáticos por filtro, com proteção contra repetição imediata na renovação.
- Histórico persistente separado para palavras exibidas, com migração e limpeza de identificadores antigos.
- Painel de estatísticas do banco por categoria e dificuldade, com reinício manual confirmado.
- Fila completa com ações **Acertou**, **Errou** e **Pulou**; palavras puladas retornam ao fim da fila.
- Cronômetro calculado pela referência real de tempo decorrido, com destaque nos 10 segundos finais.
- Atalhos `Enter`, `A`, `P` e `E`, controles grandes para toque, tela cheia e layout para celular, tablet, computador e TV.
- Sons opcionais gerados no navegador, sem arquivos de áudio externos.
- Resultado detalhado e histórico persistente das últimas 100 partidas.
- Testes automatizados do banco, sorteio inteligente, ciclos, fila, pontuação, término, cliques duplicados e persistência.

## Executar localmente

Requer Node.js `20.19` ou mais recente (ou Node.js `22.12+`).

```bash
npm install
npm run dev
```

O Vite mostrará o endereço local, normalmente `http://localhost:5173`.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Publicar na Vercel

O arquivo `vercel.json` registra explicitamente o framework Vite, o comando `npm run build` e o diretório de saída `dist`.

### Pelo GitHub

1. Envie o projeto para um repositório GitHub.
2. No painel da Vercel, escolha **Add New → Project** e importe o repositório.
3. Como este aplicativo está dentro de outro diretório de trabalho, defina **Root Directory** como `senha-rapida`.
4. Confirme o preset **Vite**. O build deve aparecer como `npm run build` e a saída como `dist`.
5. Clique em **Deploy** e aguarde o status de sucesso.
6. Abra a URL fornecida pela Vercel e execute uma partida curta antes de divulgar o endereço.

### Pela CLI

```bash
npx vercel --cwd senha-rapida
```

Execute o comando acima a partir da raiz do repositório. A primeira execução solicitará a vinculação do projeto. Para produção, depois de validar a prévia:

```bash
npx vercel --cwd senha-rapida --prod
```

Não há variáveis de ambiente obrigatórias.

## Estado do Git

No workspace em que este projeto foi preparado, o repositório raiz ainda não possuía commits nem remoto configurado. Para enviar somente este aplicativo sem incluir os demais arquivos do workspace:

```bash
git add senha-rapida
git commit -m "feat: prepara Senha Rápida para publicação"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Antes de executar, substitua `URL_DO_REPOSITORIO` pela URL criada no GitHub e confirme com `git status` que somente os arquivos desejados serão versionados.

Arquivos de ambiente, dependências, builds, cobertura, logs, cache do Vite e estado local da Vercel estão excluídos pelo `.gitignore`.

## Estrutura principal

- `src/data/wordBank.ts`, `additionalWords.ts` e `wordsDatabase.ts`: banco local modular de palavras.
- `src/lib/gameEngine.ts`: regras puras da fila e pontuação.
- `src/lib/wordGenerator.ts`: filtros, sorteio inteligente e renovação de ciclos.
- `src/lib/wordHistory.ts`: persistência das palavras efetivamente exibidas.
- `src/lib/wordStatistics.ts`: métricas do banco conforme os filtros.
- `src/lib/storage.ts`: configurações e histórico local.
- `src/screens/`: telas do menu, preparação, jogo, resultados e histórico.

## Limitações conhecidas

- Os dados são locais ao navegador/dispositivo e não são sincronizados.
- O jogo não reconhece voz nem valida automaticamente as dicas, conforme o escopo desta versão.
- Efeitos sonoros dependem da permissão de reprodução do navegador após interação do usuário.
