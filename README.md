# Senha Rápida

Jogo de adivinhação de palavras com modo presencial, treinamento individual e uma primeira implementação do multiplayer online. O frontend usa React, TypeScript, Vite, Tailwind CSS e Lucide. Os modos locais continuam independentes; o modo online usa um projeto Supabase dedicado.

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
- Modo Treinamento sem cronômetro, com tentativas ilimitadas, dicas sequenciais e resposta por clique ou `Enter`.
- Banco inicial de treinamento com 150 palavras e 600 dicas cadastradas, distribuídas por todas as 10 categorias e 3 dificuldades.
- Estatísticas individuais de acertos, palavras puladas, palpites incorretos e média de dicas por acerto.
- Configurações, ciclo de palavras e histórico do treinamento totalmente separados do modo presencial.
- Salas online privadas para dois jogadores, com sessão anônima, convite por código ou link e reconexão.
- Papéis de fornecedor de dicas e adivinhador atribuídos no servidor, chat Realtime e pontuação compartilhada.
- Palavra secreta protegida no banco: o adivinhador não a recebe enquanto estiver ativa.
- RLS, canais privados, RPCs transacionais, limites de frequência e ações idempotentes no multiplayer.
- Testes automatizados do banco, sorteio inteligente, ciclos, fila, pontuação, término, cliques duplicados e persistência.

## Executar localmente

Requer Node.js `20.19` ou mais recente (ou Node.js `22.12+`).

```bash
npm install
npm run dev
```

O Vite mostrará o endereço local, normalmente `http://localhost:5173`.

Sem as variáveis do Supabase, o site continua funcionando e o Modo Online informa que aguarda conexão. Para testar o multiplayer localmente:

```bash
npx supabase start
```

Copie apenas `API_URL` e `PUBLISHABLE_KEY` da saída para um `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:55321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

O primeiro `supabase start` aplica a migration e importa automaticamente as 2.100 palavras de `supabase/seed.sql`. Nunca coloque a secret key, service role ou senha do banco em variáveis `VITE_*`.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:online:local
npx supabase db lint --local --level warning
```

O teste de integração online cria três sessões anônimas independentes no Supabase local para validar os dois jogadores, bloqueio do terceiro, RLS, Realtime privado, palavra secreta, regras, idempotência, reconexão e inversão de papéis.

## Publicar na Vercel

O arquivo `vercel.json` registra explicitamente o framework Vite, o comando `npm run build` e o diretório de saída `dist`.

### Pelo GitHub

1. Envie o projeto para um repositório GitHub.
2. No painel da Vercel, escolha **Add New → Project** e importe o repositório.
3. Mantenha **Root Directory** como `./`, pois o aplicativo está na raiz do repositório.
4. Confirme o preset **Vite**. O build deve aparecer como `npm run build` e a saída como `dist`.
5. Clique em **Deploy** e aguarde o status de sucesso.
6. Para uma prévia do modo online, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_TURNSTILE_SITE_KEY` somente no ambiente **Preview** e valide dois dispositivos antes de promover para produção.
7. Abra a URL fornecida pela Vercel e execute uma partida curta antes de divulgar o endereço.

### Pela CLI

```bash
npx vercel
```

Execute o comando acima a partir da raiz do repositório. A primeira execução solicitará a vinculação do projeto. Para produção, depois de validar a prévia:

```bash
npx vercel --prod
```

As variáveis do Supabase são opcionais para os modos locais e obrigatórias para o multiplayer. Antes de uma publicação pública, crie um projeto Supabase exclusivo, aplique `supabase/migrations` e `supabase/seed.sql`, habilite login anônimo, desabilite canais públicos de Realtime e configure Cloudflare Turnstile com `VITE_TURNSTILE_SITE_KEY`. Consulte [docs/multiplayer-online.md](docs/multiplayer-online.md).

O projeto está publicado a partir do repositório [MaiconFelipedev/mega-senha-game](https://github.com/MaiconFelipedev/mega-senha-game). Novos commits na branch `main` geram uma nova implantação de produção pela Vercel.

Arquivos de ambiente, dependências, builds, cobertura, logs, cache do Vite e estado local da Vercel estão excluídos pelo `.gitignore`.

## Estrutura principal

- `src/data/wordBank.ts`, `additionalWords.ts` e `wordsDatabase.ts`: banco local modular de palavras.
- `src/lib/gameEngine.ts`: regras puras da fila e pontuação.
- `src/lib/wordGenerator.ts`: filtros, sorteio inteligente e renovação de ciclos.
- `src/lib/wordHistory.ts`: persistência das palavras efetivamente exibidas.
- `src/lib/wordStatistics.ts`: métricas do banco conforme os filtros.
- `src/lib/storage.ts`: configurações e histórico local.
- `src/data/trainingHints.ts`: banco revisado de palavras e dicas do treinamento.
- `src/lib/trainingEngine.ts`: filtros, sorteio, validação e estatísticas do treinamento.
- `src/lib/trainingStorage.ts`: configurações, palavras utilizadas e histórico individual.
- `src/multiplayer/`: cliente Supabase, contrato, validações, sincronização e recuperação de sessão online.
- `src/screens/OnlineModeScreen.tsx`: entrada, sala de espera, jogo e resultado do multiplayer.
- `supabase/migrations/`: tabelas, RLS, autorização Realtime e RPCs protegidas.
- `supabase/seed.sql`: cópia controlada do banco local de 2.100 palavras para sorteio no servidor.
- `scripts/test-online-integration.mjs`: cenário real com clientes Supabase independentes.
- `src/screens/`: telas do menu, preparação, jogo, treinamento, resultados e históricos.

## Limitações conhecidas

- Resultados e históricos dos modos presencial e treinamento permanecem locais ao navegador/dispositivo; somente a sala online é sincronizada.
- O treinamento usa exclusivamente dicas previamente cadastradas; não há geração por IA nem reconhecimento de sinônimos.
- O jogo não reconhece voz, conforme o escopo desta versão.
- Efeitos sonoros dependem da permissão de reprodução do navegador após interação do usuário.
- A Preview do multiplayer ainda depende da reconciliação do histórico de migrations, do Turnstile habilitado no Supabase Auth e da homologação em dois dispositivos reais antes de qualquer publicação na `main`.
