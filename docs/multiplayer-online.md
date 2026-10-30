# Multiplayer online — arquitetura e preparação

## Estado da fase 1

O modo online foi implementado na branch `feat/multiplayer-online` e validado contra um Supabase local. A branch `main` e a Vercel de produção não devem receber esta fase até que um projeto Supabase exclusivo esteja disponível e o teste com dois aparelhos reais seja aprovado.

## Fluxo

1. O navegador cria ou recupera uma sessão anônima do Supabase Auth.
2. `create_online_room` gera um código aleatório de oito caracteres no PostgreSQL e registra o criador como fornecedor de dicas.
3. `join_online_room` valida expiração, lotação, início da partida e limite de tentativas antes de ocupar o segundo e último assento.
4. O criador configura palavras, categorias e dificuldade. O servidor somente inicia quando os dois participantes estão conectados e prontos.
5. `start_online_game` sorteia as palavras no banco protegido. A tabela `online_game_words` não possui leitura para clientes.
6. `get_online_room_state` devolve a palavra ativa somente ao participante com papel `giver`. O adivinhador recebe `secretWord: null`.
7. Dicas, palpites, acertos e pulos passam por RPCs `security definer` com `search_path` vazio, verificação de membro/papel, locks e idempotência.
8. Triggers enviam somente o evento privado `room_changed`; cada cliente busca novamente o estado autorizado. O payload Realtime nunca contém a palavra.
9. O heartbeat persiste `last_seen_at`. Uma atualização de página recupera a mesma sessão e o estado do servidor.

## Tabelas

- `online_words`: banco protegido sincronizado a partir do banco local.
- `online_rooms`: código, estado, configurações, pontuação e expiração.
- `online_participants`: dois assentos fixos, papel, prontidão e último contato.
- `online_games`: rodada, papéis atribuídos, posição e pontuação.
- `online_game_words`: sequência secreta e resolução de cada palavra.
- `online_messages`: mensagens de jogo, ordenação e chave idempotente.
- `online_join_attempts`: limitação de tentativas de códigos.
- `online_room_seen_words`: preferência por palavras inéditas em novas rodadas da sala.

Todas as tabelas usam RLS. Palavras, palavras da rodada, tentativas e histórico de palavras vistas não possuem políticas de leitura para o navegador.

## Configuração externa obrigatória

1. Disponibilize um projeto Supabase separado para o Senha Rápida.
2. Vincule o projeto com a Supabase CLI ou execute a migration e o seed pelo painel.
3. Em **Authentication → Providers**, habilite **Anonymous Sign-Ins**.
4. Em **Realtime Settings**, desabilite **Allow public access**. Os clientes usam canais `private: true` e as políticas de `realtime.messages` limitam o tópico aos participantes.
5. Defina um limite conservador para logins anônimos. Para exposição pública, configure Cloudflare Turnstile no Supabase e na Vercel. Ao definir `VITE_TURNSTILE_SITE_KEY`, a interface exige o desafio e envia o token ao `signInAnonymously`. Em builds de produção, o Modo Online permanece bloqueado se a Site Key estiver ausente.
6. Programe `cleanup_online_multiplayer_data()` em um job protegido (por exemplo, Supabase Cron) para expirar salas e remover dados temporários antigos.
7. Configure somente a URL e a publishable key no Vite/Vercel. Nunca exponha secret key, service role ou senha do PostgreSQL.

## Vercel Preview

1. Envie a branch de feature ao GitHub quando autorizado.
2. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_TURNSTILE_SITE_KEY` apenas no ambiente **Preview**.
3. Gere uma implantação de prévia sem promover para produção.
4. Mantenha a Vercel Authentication habilitada e crie um Shareable Link revogável somente para os testadores convidados. Não torne a branch publicamente acessível antes de validar o CAPTCHA.
5. Abra o link em dois celulares, de preferência um no Wi‑Fi e outro em rede móvel.
6. Valide criação por apelido, entrada por código e link, prontidão, dicas, palpites, acerto, pulo, reconexão, término e inversão de papéis.
7. Confirme no DevTools do adivinhador que a resposta ativa não aparece em respostas HTTP, eventos Realtime ou estado do frontend.

## Cloudflare Turnstile

1. No painel Cloudflare, crie um widget Turnstile real em modo **Managed**; chaves de teste não protegem uma Preview pública.
2. Autorize somente o hostname da URL de branch da Vercel, sem protocolo, porta ou caminho. O hostname pode ser acrescentado ao widget depois que o primeiro deployment gerar a URL.
3. Configure a Site Key como `VITE_TURNSTILE_SITE_KEY` no ambiente **Preview** da Vercel.
4. Em **Supabase → Authentication → Bot and Abuse Protection**, selecione Turnstile, cadastre o Secret Key e habilite CAPTCHA. Um secret de Edge Functions não configura o Supabase Auth.
5. O frontend usa renderização explícita, envia o token em `captchaToken` para `signInAnonymously` e limpa o token em erro, expiração ou timeout. O widget renova automaticamente tokens expirados e tentativas com falha.
6. Tokens Turnstile são de uso único e expiram em cinco minutos. Valide criação e ingresso tanto em condição normal quanto após deixar o desafio expirar.

## Comandos de validação

```bash
npx supabase start
npm run test:online:local
npx supabase db lint --local --level warning
npm run typecheck
npm run lint
npm test
npm run build
```

O teste local prova o comportamento do backend e de clientes independentes, mas não substitui o ensaio final em dois dispositivos usando a prévia pública.
