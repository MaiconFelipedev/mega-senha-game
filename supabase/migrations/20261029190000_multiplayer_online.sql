-- Senha Rápida — multiplayer online (fase 1)
-- Toda ação sensível passa pelas RPCs abaixo. As tabelas de palavras e palavras
-- da rodada não possuem políticas de leitura para o cliente.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

create type public.online_room_status as enum ('waiting', 'playing', 'finished', 'cancelled', 'expired');
create type public.online_role as enum ('giver', 'guesser');
create type public.online_game_status as enum ('playing', 'finished', 'cancelled');
create type public.online_word_status as enum ('pending', 'active', 'correct', 'skipped');
create type public.online_message_kind as enum ('hint', 'guess', 'system', 'correct', 'error', 'request_hint');

create table public.online_words (
  id text primary key,
  text text not null check (char_length(text) between 1 and 80),
  normalized_text text not null,
  category text not null check (category in ('animais','objetos','alimentos','profissoes','lugares','natureza','esportes','tecnologia','cotidiano','cultura_geral')),
  difficulty text not null check (difficulty in ('facil','medio','dificil')),
  created_at timestamptz not null default now()
);

create index online_words_filter_idx on public.online_words (category, difficulty);

create table public.online_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  owner_participant_id uuid,
  active_game_id uuid,
  status public.online_room_status not null default 'waiting',
  word_count smallint not null default 10 check (word_count in (5,10,15,20)),
  categories text[] not null,
  difficulty text not null default 'misturado' check (difficulty in ('facil','medio','dificil','misturado')),
  score integer not null default 0 check (score >= 0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index online_rooms_code_status_idx on public.online_rooms (code, status);
create index online_rooms_expiration_idx on public.online_rooms (expires_at) where status in ('waiting','playing');

create table public.online_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  role public.online_role not null,
  seat smallint not null check (seat in (1,2)),
  ready boolean not null default false,
  last_seen_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (room_id, user_id),
  unique (room_id, seat)
);

create index online_participants_user_idx on public.online_participants (user_id, room_id);

alter table public.online_rooms
  add constraint online_rooms_owner_participant_fk
  foreign key (owner_participant_id) references public.online_participants (id) on delete set null;

create table public.online_games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  status public.online_game_status not null default 'playing',
  giver_participant_id uuid not null references public.online_participants (id),
  guesser_participant_id uuid not null references public.online_participants (id),
  total_words smallint not null check (total_words in (5,10,15,20)),
  current_position smallint not null default 0,
  score integer not null default 0 check (score >= 0),
  version integer not null default 1,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  cancelled_at timestamptz
);

create index online_games_room_idx on public.online_games (room_id, started_at desc);

alter table public.online_rooms
  add constraint online_rooms_active_game_fk
  foreign key (active_game_id) references public.online_games (id) on delete set null;

create table public.online_game_words (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.online_games (id) on delete cascade,
  word_id text not null references public.online_words (id),
  position smallint not null,
  status public.online_word_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  resolved_at timestamptz,
  unique (game_id, position),
  unique (game_id, word_id)
);

create index online_game_words_active_idx on public.online_game_words (game_id, status, position);

create table public.online_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  game_id uuid references public.online_games (id) on delete cascade,
  sender_participant_id uuid references public.online_participants (id) on delete set null,
  kind public.online_message_kind not null,
  body text not null check (char_length(body) between 1 and 160),
  client_action_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  unique (game_id, sender_participant_id, client_action_id)
);

create index online_messages_room_created_idx on public.online_messages (room_id, created_at, id);
create index online_messages_sender_rate_idx on public.online_messages (sender_participant_id, created_at desc);

create table public.online_join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  room_code text not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index online_join_attempts_rate_idx on public.online_join_attempts (user_id, created_at desc);

create table public.online_room_seen_words (
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  word_id text not null references public.online_words (id),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, word_id)
);

alter table public.online_words enable row level security;
alter table public.online_rooms enable row level security;
alter table public.online_participants enable row level security;
alter table public.online_games enable row level security;
alter table public.online_game_words enable row level security;
alter table public.online_messages enable row level security;
alter table public.online_join_attempts enable row level security;
alter table public.online_room_seen_words enable row level security;

revoke all on public.online_words from anon, authenticated;
revoke all on public.online_game_words from anon, authenticated;
revoke all on public.online_join_attempts from anon, authenticated;
revoke all on public.online_room_seen_words from anon, authenticated;

grant select on public.online_rooms, public.online_participants, public.online_games, public.online_messages to authenticated;

create or replace function public.is_online_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.online_participants p
    where p.room_id = p_room_id
      and p.user_id = (select auth.uid())
      and p.left_at is null
  );
$$;

create or replace function public.can_access_online_topic(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.online_participants p
    where p.user_id = (select auth.uid())
      and p.left_at is null
      and ('room:' || p.room_id::text) = p_topic
  );
$$;

revoke execute on function public.is_online_room_member(uuid) from public, anon;
revoke execute on function public.can_access_online_topic(text) from public, anon;
grant execute on function public.is_online_room_member(uuid) to authenticated;
grant execute on function public.can_access_online_topic(text) to authenticated;

create policy "room members can read rooms"
on public.online_rooms for select to authenticated
using (public.is_online_room_member(id));

create policy "room members can read participants"
on public.online_participants for select to authenticated
using (public.is_online_room_member(room_id));

create policy "room members can read games"
on public.online_games for select to authenticated
using (public.is_online_room_member(room_id));

create policy "room members can read messages"
on public.online_messages for select to authenticated
using (public.is_online_room_member(room_id));

create policy "online members can receive private realtime events"
on realtime.messages for select to authenticated
using (public.can_access_online_topic((select realtime.topic())));

create policy "online members can send private realtime events"
on realtime.messages for insert to authenticated
with check (public.can_access_online_topic((select realtime.topic())));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'online_rooms') then
      alter publication supabase_realtime add table public.online_rooms;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'online_participants') then
      alter publication supabase_realtime add table public.online_participants;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'online_games') then
      alter publication supabase_realtime add table public.online_games;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'online_messages') then
      alter publication supabase_realtime add table public.online_messages;
    end if;
  end if;
end;
$$;

-- Broadcast privado é o sinal leve de sincronização; ao recebê-lo, cada cliente
-- busca novamente o estado autorizado pelo servidor. Nenhum segredo vai no evento.
create or replace function public.broadcast_online_room_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
begin
  if tg_table_name = 'online_rooms' then
    v_room_id := coalesce(new.id, old.id);
  else
    v_room_id := coalesce(new.room_id, old.room_id);
  end if;
  perform realtime.broadcast_changes(
    'room:' || v_room_id::text,
    'room_changed',
    tg_op,
    tg_table_name,
    tg_table_schema,
    null,
    null
  );
  return null;
end;
$$;

create trigger broadcast_online_rooms
after insert or update or delete on public.online_rooms
for each row execute function public.broadcast_online_room_change();

create trigger broadcast_online_participants
after insert or update or delete on public.online_participants
for each row execute function public.broadcast_online_room_change();

create trigger broadcast_online_games
after insert or update or delete on public.online_games
for each row execute function public.broadcast_online_room_change();

create trigger broadcast_online_messages
after insert or update or delete on public.online_messages
for each row execute function public.broadcast_online_room_change();

revoke execute on function public.broadcast_online_room_change() from public, anon, authenticated;

create or replace function public.normalize_online_text(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(extensions.unaccent(regexp_replace(trim(coalesce(p_value, '')), '\s+', ' ', 'g')));
$$;

create or replace function public.generate_online_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(8);
  v_code text := '';
begin
  for i in 0..7 loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % char_length(v_alphabet)) + 1, 1);
  end loop;
  return v_code;
end;
$$;

create or replace function public.expire_online_rooms()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.online_rooms
  set status = 'expired', updated_at = now(), version = version + 1
  where status in ('waiting','playing') and expires_at <= now();
$$;

revoke execute on function public.normalize_online_text(text) from public, anon;
revoke execute on function public.generate_online_room_code() from public, anon, authenticated;
revoke execute on function public.expire_online_rooms() from public, anon, authenticated;

create or replace function public.get_online_room_state(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_me public.online_participants;
  v_room public.online_rooms;
  v_game public.online_games;
  v_secret_word text;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  perform public.expire_online_rooms();

  select * into v_me
  from public.online_participants
  where room_id = p_room_id and user_id = v_user_id and left_at is null;
  if not found then raise exception 'not_room_member'; end if;

  select * into v_room from public.online_rooms where id = p_room_id;
  if not found then raise exception 'room_not_found'; end if;

  if v_room.active_game_id is not null then
    select * into v_game from public.online_games where id = v_room.active_game_id;
    if v_game.id is not null and v_me.role = 'giver' and v_game.status = 'playing' then
      select w.text into v_secret_word
      from public.online_game_words gw
      join public.online_words w on w.id = gw.word_id
      where gw.game_id = v_game.id and gw.position = v_game.current_position and gw.status = 'active';
    end if;
  end if;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'status', v_room.status,
      'ownerParticipantId', v_room.owner_participant_id,
      'settings', jsonb_build_object('wordCount', v_room.word_count, 'categories', v_room.categories, 'difficulty', v_room.difficulty),
      'score', v_room.score,
      'createdAt', v_room.created_at,
      'expiresAt', v_room.expires_at
    ),
    'me', jsonb_build_object(
      'id', v_me.id,
      'nickname', v_me.nickname,
      'role', v_me.role,
      'seat', v_me.seat,
      'ready', v_me.ready,
      'connected', true,
      'isMe', true
    ),
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'nickname', p.nickname,
        'role', p.role,
        'seat', p.seat,
        'ready', p.ready,
        'connected', p.last_seen_at > now() - interval '45 seconds',
        'isMe', p.user_id = v_user_id
      ) order by p.seat)
      from public.online_participants p
      where p.room_id = p_room_id and p.left_at is null
    ), '[]'::jsonb),
    'game', case when v_game.id is null then null else jsonb_build_object(
      'id', v_game.id,
      'status', v_game.status,
      'currentPosition', v_game.current_position,
      'totalWords', v_game.total_words,
      'score', v_game.score,
      'secretWord', v_secret_word,
      'startedAt', v_game.started_at,
      'finishedAt', v_game.finished_at
    ) end,
    'messages', coalesce((
      select jsonb_agg(message_row.payload order by message_row.created_at, message_row.id)
      from (
        select m.id, m.created_at, jsonb_build_object(
          'id', m.id,
          'kind', m.kind,
          'body', m.body,
          'senderParticipantId', m.sender_participant_id,
          'senderNickname', p.nickname,
          'createdAt', m.created_at
        ) as payload
        from public.online_messages m
        left join public.online_participants p on p.id = m.sender_participant_id
        where m.room_id = p_room_id and (v_game.id is null or m.game_id = v_game.id)
        order by m.created_at desc, m.id desc
        limit 200
      ) message_row
    ), '[]'::jsonb),
    'resolvedWords', case when v_game.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', gw.position,
        'word', w.text,
        'outcome', gw.status
      ) order by gw.position)
      from public.online_game_words gw
      join public.online_words w on w.id = gw.word_id
      where gw.game_id = v_game.id and gw.status in ('correct','skipped')
    ), '[]'::jsonb) end
  );
end;
$$;

revoke execute on function public.get_online_room_state(uuid) from public, anon;
grant execute on function public.get_online_room_state(uuid) to authenticated;

create or replace function public.create_online_room(
  p_nickname text,
  p_word_count smallint,
  p_categories text[],
  p_difficulty text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := regexp_replace(trim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  v_room public.online_rooms;
  v_participant public.online_participants;
  v_code text;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if char_length(v_nickname) not between 2 and 24 then raise exception 'invalid_nickname'; end if;
  if v_nickname !~ '^[[:alnum:]À-ÿ ._-]+$' then raise exception 'invalid_nickname'; end if;
  if (select count(*) from public.online_rooms where owner_user_id = v_user_id and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'action_rate_limited';
  end if;
  if p_word_count not in (5,10,15,20) then raise exception 'invalid_settings'; end if;
  if p_difficulty not in ('facil','medio','dificil','misturado') then raise exception 'invalid_settings'; end if;
  if coalesce(array_length(p_categories, 1), 0) = 0
    or not p_categories <@ array['animais','objetos','alimentos','profissoes','lugares','natureza','esportes','tecnologia','cotidiano','cultura_geral']::text[]
  then raise exception 'invalid_settings'; end if;

  perform public.expire_online_rooms();
  for v_attempt in 1..16 loop
    v_code := public.generate_online_room_code();
    begin
      insert into public.online_rooms (code, owner_user_id, word_count, categories, difficulty)
      values (v_code, v_user_id, p_word_count, p_categories, p_difficulty)
      returning * into v_room;
      exit;
    exception when unique_violation then
      if v_attempt = 16 then raise exception 'room_code_generation_failed'; end if;
    end;
  end loop;

  insert into public.online_participants (room_id, user_id, nickname, role, seat)
  values (v_room.id, v_user_id, v_nickname, 'giver', 1)
  returning * into v_participant;

  update public.online_rooms
  set owner_participant_id = v_participant.id
  where id = v_room.id;

  return public.get_online_room_state(v_room.id);
end;
$$;

create or replace function public.join_online_room(p_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_nickname text := regexp_replace(trim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  v_room public.online_rooms;
  v_attempt_id bigint;
  v_existing uuid;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if v_code !~ '^[A-HJ-NP-Z2-9]{8}$' then raise exception 'invalid_code'; end if;
  if char_length(v_nickname) not between 2 and 24 then raise exception 'invalid_nickname'; end if;
  if v_nickname !~ '^[[:alnum:]À-ÿ ._-]+$' then raise exception 'invalid_nickname'; end if;
  if (select count(*) from public.online_join_attempts where user_id = v_user_id and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many_join_attempts';
  end if;

  insert into public.online_join_attempts (user_id, room_code) values (v_user_id, v_code) returning id into v_attempt_id;
  perform public.expire_online_rooms();

  select * into v_room from public.online_rooms where code = v_code for update;
  if not found then raise exception 'room_not_found'; end if;
  if v_room.status = 'expired' then raise exception 'room_expired'; end if;

  select id into v_existing
  from public.online_participants
  where room_id = v_room.id and user_id = v_user_id and left_at is null;
  if v_existing is not null then
    update public.online_join_attempts set succeeded = true where id = v_attempt_id;
    return public.get_online_room_state(v_room.id);
  end if;

  if v_room.status <> 'waiting' then raise exception 'room_started'; end if;
  -- Nunca substitua um dos dois primeiros participantes, mesmo após saída explícita.
  if (select count(*) from public.online_participants where room_id = v_room.id) >= 2 then raise exception 'room_full'; end if;

  insert into public.online_participants (room_id, user_id, nickname, role, seat)
  values (v_room.id, v_user_id, v_nickname, 'guesser', 2);

  update public.online_join_attempts set succeeded = true where id = v_attempt_id;
  update public.online_rooms
  set updated_at = now(), last_activity_at = now(), expires_at = now() + interval '30 minutes', version = version + 1
  where id = v_room.id;

  return public.get_online_room_state(v_room.id);
end;
$$;

create or replace function public.update_online_room_settings(
  p_room_id uuid,
  p_word_count smallint,
  p_categories text[],
  p_difficulty text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.online_rooms;
begin
  select * into v_room from public.online_rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if v_room.owner_user_id <> auth.uid() then raise exception 'not_room_owner'; end if;
  if v_room.status <> 'waiting' then raise exception 'room_started'; end if;
  if p_word_count not in (5,10,15,20)
    or p_difficulty not in ('facil','medio','dificil','misturado')
    or coalesce(array_length(p_categories, 1), 0) = 0
    or not p_categories <@ array['animais','objetos','alimentos','profissoes','lugares','natureza','esportes','tecnologia','cotidiano','cultura_geral']::text[]
  then raise exception 'invalid_settings'; end if;

  update public.online_rooms
  set word_count = p_word_count,
      categories = p_categories,
      difficulty = p_difficulty,
      updated_at = now(),
      last_activity_at = now(),
      expires_at = now() + interval '30 minutes',
      version = version + 1
  where id = p_room_id;
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.set_online_ready(p_room_id uuid, p_ready boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.online_participants
  set ready = p_ready, last_seen_at = now()
  where room_id = p_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'not_room_member'; end if;
  update public.online_rooms
  set last_activity_at = now(), expires_at = now() + interval '30 minutes', version = version + 1
  where id = p_room_id and status = 'waiting';
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.start_online_game(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.online_rooms;
  v_giver uuid;
  v_guesser uuid;
  v_game_id uuid;
  v_selected integer;
begin
  select * into v_room from public.online_rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if v_room.owner_user_id <> auth.uid() then raise exception 'not_room_owner'; end if;
  if v_room.status <> 'waiting' then raise exception 'room_started'; end if;
  if (select count(*) from public.online_participants where room_id = p_room_id and left_at is null and ready and last_seen_at > now() - interval '45 seconds') <> 2 then
    raise exception 'participants_not_ready';
  end if;

  select id into v_giver from public.online_participants where room_id = p_room_id and role = 'giver' and left_at is null;
  select id into v_guesser from public.online_participants where room_id = p_room_id and role = 'guesser' and left_at is null;
  if v_giver is null or v_guesser is null then raise exception 'participants_not_ready'; end if;

  insert into public.online_games (room_id, giver_participant_id, guesser_participant_id, total_words)
  values (p_room_id, v_giver, v_guesser, v_room.word_count)
  returning id into v_game_id;

  insert into public.online_game_words (game_id, word_id, position)
  select v_game_id, candidate.id, (row_number() over ())::smallint - 1
  from (
    select w.id
    from public.online_words w
    where w.category = any(v_room.categories)
      and (v_room.difficulty = 'misturado' or w.difficulty = v_room.difficulty)
    order by exists (
      select 1 from public.online_room_seen_words seen
      where seen.room_id = p_room_id and seen.word_id = w.id
    ), random()
    limit v_room.word_count
  ) candidate;
  get diagnostics v_selected = row_count;
  if v_selected <> v_room.word_count then raise exception 'not_enough_words'; end if;

  update public.online_game_words set status = 'active' where game_id = v_game_id and position = 0;
  update public.online_rooms
  set active_game_id = v_game_id,
      status = 'playing',
      score = 0,
      updated_at = now(),
      last_activity_at = now(),
      expires_at = now() + interval '30 minutes',
      version = version + 1
  where id = p_room_id;
  update public.online_participants set ready = false where room_id = p_room_id and left_at is null;
  insert into public.online_messages (room_id, game_id, kind, body)
  values (p_room_id, v_game_id, 'system', 'A partida começou! O fornecedor já pode enviar a primeira dica.');

  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.advance_online_game(p_room_id uuid, p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next_position smallint;
begin
  select min(position) into v_next_position
  from public.online_game_words
  where game_id = p_game_id and status = 'pending';

  if v_next_position is null then
    update public.online_games
    set status = 'finished', finished_at = now(), version = version + 1
    where id = p_game_id;
    update public.online_rooms
    set status = 'finished', updated_at = now(), version = version + 1
    where id = p_room_id;
    insert into public.online_messages (room_id, game_id, kind, body)
    values (p_room_id, p_game_id, 'system', 'Rodada concluída! Confiram o resultado da dupla.');
  else
    update public.online_game_words set status = 'active' where game_id = p_game_id and position = v_next_position;
    update public.online_games
    set current_position = v_next_position, version = version + 1
    where id = p_game_id;
  end if;

  update public.online_rooms
  set last_activity_at = now(), expires_at = now() + interval '30 minutes'
  where id = p_room_id;
end;
$$;

revoke execute on function public.advance_online_game(uuid, uuid) from public, anon, authenticated;

create or replace function public.send_online_hint(p_room_id uuid, p_hint text, p_client_action_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.online_participants;
  v_room public.online_rooms;
  v_game public.online_games;
  v_hint text := trim(coalesce(p_hint, ''));
  v_answer text;
  v_normalized_hint text;
  v_normalized_answer text;
begin
  select * into v_participant
  from public.online_participants
  where room_id = p_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'not_room_member'; end if;
  if v_participant.role <> 'giver' then raise exception 'not_giver'; end if;
  if char_length(v_hint) not between 1 and 32 or v_hint ~ '\s' then raise exception 'invalid_hint'; end if;

  select * into v_room from public.online_rooms where id = p_room_id for update;
  if v_room.status <> 'playing' or v_room.active_game_id is null then raise exception 'game_not_active'; end if;
  select * into v_game from public.online_games where id = v_room.active_game_id for update;
  if v_game.status <> 'playing' or v_game.giver_participant_id <> v_participant.id then raise exception 'not_giver'; end if;

  if exists (
    select 1 from public.online_messages
    where game_id = v_game.id and sender_participant_id = v_participant.id and client_action_id = p_client_action_id
  ) then return public.get_online_room_state(p_room_id); end if;
  if (select count(*) from public.online_messages where sender_participant_id = v_participant.id and created_at > clock_timestamp() - interval '5 seconds') >= 6 then
    raise exception 'action_rate_limited';
  end if;

  select w.text into v_answer
  from public.online_game_words gw
  join public.online_words w on w.id = gw.word_id
  where gw.game_id = v_game.id and gw.position = v_game.current_position and gw.status = 'active';
  if v_answer is null then raise exception 'game_not_active'; end if;
  v_normalized_hint := public.normalize_online_text(v_hint);
  v_normalized_answer := public.normalize_online_text(v_answer);
  if v_normalized_hint = v_normalized_answer
    or (char_length(v_normalized_hint) >= 4 and position(v_normalized_hint in v_normalized_answer) > 0)
    or (char_length(v_normalized_answer) >= 4 and position(v_normalized_answer in v_normalized_hint) > 0)
  then raise exception 'forbidden_hint'; end if;

  insert into public.online_messages (room_id, game_id, sender_participant_id, kind, body, client_action_id)
  values (p_room_id, v_game.id, v_participant.id, 'hint', v_hint, p_client_action_id);
  update public.online_participants set last_seen_at = now() where id = v_participant.id;
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.send_online_guess(p_room_id uuid, p_guess text, p_client_action_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.online_participants;
  v_room public.online_rooms;
  v_game public.online_games;
  v_game_word_id uuid;
  v_word_id text;
  v_guess text := regexp_replace(trim(coalesce(p_guess, '')), '\s+', ' ', 'g');
  v_answer text;
begin
  select * into v_participant
  from public.online_participants
  where room_id = p_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'not_room_member'; end if;
  if v_participant.role <> 'guesser' then raise exception 'not_guesser'; end if;
  if char_length(v_guess) not between 1 and 64 then raise exception 'invalid_guess'; end if;

  select * into v_room from public.online_rooms where id = p_room_id for update;
  if v_room.status <> 'playing' or v_room.active_game_id is null then raise exception 'game_not_active'; end if;
  select * into v_game from public.online_games where id = v_room.active_game_id for update;
  if v_game.status <> 'playing' or v_game.guesser_participant_id <> v_participant.id then raise exception 'not_guesser'; end if;

  if exists (
    select 1 from public.online_messages
    where game_id = v_game.id and sender_participant_id = v_participant.id and client_action_id = p_client_action_id
  ) then return public.get_online_room_state(p_room_id); end if;
  if (select count(*) from public.online_messages where sender_participant_id = v_participant.id and created_at > clock_timestamp() - interval '5 seconds') >= 10 then
    raise exception 'action_rate_limited';
  end if;

  select gw.id, gw.word_id, w.text into v_game_word_id, v_word_id, v_answer
  from public.online_game_words gw
  join public.online_words w on w.id = gw.word_id
  where gw.game_id = v_game.id and gw.position = v_game.current_position and gw.status = 'active'
  for update of gw;
  if v_game_word_id is null then raise exception 'game_not_active'; end if;

  insert into public.online_messages (room_id, game_id, sender_participant_id, kind, body, client_action_id)
  values (p_room_id, v_game.id, v_participant.id, 'guess', v_guess, p_client_action_id);
  update public.online_game_words set attempts = attempts + 1 where id = v_game_word_id;

  if public.normalize_online_text(v_guess) = public.normalize_online_text(v_answer) then
    update public.online_game_words set status = 'correct', resolved_at = now() where id = v_game_word_id;
    insert into public.online_room_seen_words (room_id, word_id, last_seen_at)
    values (p_room_id, v_word_id, now())
    on conflict (room_id, word_id) do update set last_seen_at = excluded.last_seen_at;
    update public.online_games set score = score + 1 where id = v_game.id;
    update public.online_rooms set score = score + 1, version = version + 1 where id = p_room_id;
    insert into public.online_messages (room_id, game_id, kind, body)
    values (p_room_id, v_game.id, 'correct', 'Resposta correta: ' || v_answer || '! +1 ponto.');
    perform public.advance_online_game(p_room_id, v_game.id);
  else
    insert into public.online_messages (room_id, game_id, kind, body)
    values (p_room_id, v_game.id, 'error', 'Ainda não! Tente outro palpite.');
  end if;

  update public.online_participants set last_seen_at = now() where id = v_participant.id;
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.request_online_hint(p_room_id uuid, p_client_action_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.online_participants;
  v_room public.online_rooms;
begin
  select * into v_participant from public.online_participants
  where room_id = p_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'not_room_member'; end if;
  if v_participant.role <> 'guesser' then raise exception 'not_guesser'; end if;
  select * into v_room from public.online_rooms where id = p_room_id;
  if v_room.status <> 'playing' or v_room.active_game_id is null then raise exception 'game_not_active'; end if;
  if exists (select 1 from public.online_messages where game_id = v_room.active_game_id and sender_participant_id = v_participant.id and client_action_id = p_client_action_id) then
    return public.get_online_room_state(p_room_id);
  end if;
  if (select count(*) from public.online_messages where sender_participant_id = v_participant.id and kind = 'request_hint' and created_at > clock_timestamp() - interval '5 seconds') >= 2 then
    raise exception 'action_rate_limited';
  end if;
  insert into public.online_messages (room_id, game_id, sender_participant_id, kind, body, client_action_id)
  values (p_room_id, v_room.active_game_id, v_participant.id, 'request_hint', v_participant.nickname || ' pediu outra dica.', p_client_action_id);
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.skip_online_word(p_room_id uuid, p_client_action_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.online_participants;
  v_room public.online_rooms;
  v_game public.online_games;
  v_game_word_id uuid;
  v_word_id text;
  v_answer text;
begin
  select * into v_participant from public.online_participants
  where room_id = p_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'not_room_member'; end if;
  if v_participant.role <> 'giver' then raise exception 'not_giver'; end if;
  select * into v_room from public.online_rooms where id = p_room_id for update;
  if v_room.status <> 'playing' or v_room.active_game_id is null then raise exception 'game_not_active'; end if;
  select * into v_game from public.online_games where id = v_room.active_game_id for update;
  if v_game.giver_participant_id <> v_participant.id or v_game.status <> 'playing' then raise exception 'not_giver'; end if;
  if exists (select 1 from public.online_messages where game_id = v_game.id and sender_participant_id = v_participant.id and client_action_id = p_client_action_id) then
    return public.get_online_room_state(p_room_id);
  end if;

  select gw.id, gw.word_id, w.text into v_game_word_id, v_word_id, v_answer
  from public.online_game_words gw
  join public.online_words w on w.id = gw.word_id
  where gw.game_id = v_game.id and gw.position = v_game.current_position and gw.status = 'active'
  for update of gw;
  if v_game_word_id is null then raise exception 'game_not_active'; end if;

  insert into public.online_messages (room_id, game_id, sender_participant_id, kind, body, client_action_id)
  values (p_room_id, v_game.id, v_participant.id, 'system', 'Palavra pulada: ' || v_answer || '.', p_client_action_id);
  update public.online_game_words set status = 'skipped', resolved_at = now() where id = v_game_word_id;
  insert into public.online_room_seen_words (room_id, word_id, last_seen_at)
  values (p_room_id, v_word_id, now())
  on conflict (room_id, word_id) do update set last_seen_at = excluded.last_seen_at;
  perform public.advance_online_game(p_room_id, v_game.id);
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.touch_online_participant(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.online_participants
  set last_seen_at = now()
  where room_id = p_room_id and user_id = auth.uid() and left_at is null;
  if not found then raise exception 'not_room_member'; end if;
  update public.online_rooms
  set last_activity_at = now(), expires_at = now() + interval '30 minutes'
  where id = p_room_id and status in ('waiting','playing');
  return public.get_online_room_state(p_room_id);
end;
$$;

create or replace function public.leave_online_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant_id uuid;
  v_game_id uuid;
begin
  select id into v_participant_id
  from public.online_participants
  where room_id = p_room_id and user_id = auth.uid() and left_at is null
  for update;
  if v_participant_id is null then raise exception 'not_room_member'; end if;

  update public.online_participants set left_at = now(), ready = false where id = v_participant_id;
  select active_game_id into v_game_id from public.online_rooms where id = p_room_id for update;
  update public.online_rooms
  set status = 'cancelled', updated_at = now(), version = version + 1
  where id = p_room_id and status in ('waiting','playing');
  if v_game_id is not null then
    update public.online_games
    set status = 'cancelled', cancelled_at = now(), version = version + 1
    where id = v_game_id and status = 'playing';
  end if;
end;
$$;

create or replace function public.prepare_online_rematch(p_room_id uuid, p_invert_roles boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.online_rooms;
  v_participant_count integer;
begin
  select * into v_room from public.online_rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if v_room.owner_user_id <> auth.uid() then raise exception 'not_room_owner'; end if;
  if v_room.status <> 'finished' then raise exception 'room_not_finished'; end if;
  select count(*) into v_participant_count from public.online_participants where room_id = p_room_id and left_at is null;
  if v_participant_count <> 2 then raise exception 'participants_not_ready'; end if;

  if p_invert_roles then
    update public.online_participants
    set role = case role when 'giver' then 'guesser'::public.online_role else 'giver'::public.online_role end,
        ready = false,
        last_seen_at = now()
    where room_id = p_room_id and left_at is null;
  else
    update public.online_participants set ready = false, last_seen_at = now()
    where room_id = p_room_id and left_at is null;
  end if;

  update public.online_rooms
  set status = 'waiting',
      active_game_id = null,
      score = 0,
      updated_at = now(),
      last_activity_at = now(),
      expires_at = now() + interval '30 minutes',
      version = version + 1
  where id = p_room_id;
  return public.get_online_room_state(p_room_id);
end;
$$;

revoke execute on function public.create_online_room(text, smallint, text[], text) from public, anon;
revoke execute on function public.join_online_room(text, text) from public, anon;
revoke execute on function public.update_online_room_settings(uuid, smallint, text[], text) from public, anon;
revoke execute on function public.set_online_ready(uuid, boolean) from public, anon;
revoke execute on function public.start_online_game(uuid) from public, anon;
revoke execute on function public.send_online_hint(uuid, text, uuid) from public, anon;
revoke execute on function public.send_online_guess(uuid, text, uuid) from public, anon;
revoke execute on function public.request_online_hint(uuid, uuid) from public, anon;
revoke execute on function public.skip_online_word(uuid, uuid) from public, anon;
revoke execute on function public.touch_online_participant(uuid) from public, anon;
revoke execute on function public.leave_online_room(uuid) from public, anon;
revoke execute on function public.prepare_online_rematch(uuid, boolean) from public, anon;

grant execute on function public.create_online_room(text, smallint, text[], text) to authenticated;
grant execute on function public.join_online_room(text, text) to authenticated;
grant execute on function public.update_online_room_settings(uuid, smallint, text[], text) to authenticated;
grant execute on function public.set_online_ready(uuid, boolean) to authenticated;
grant execute on function public.start_online_game(uuid) to authenticated;
grant execute on function public.send_online_hint(uuid, text, uuid) to authenticated;
grant execute on function public.send_online_guess(uuid, text, uuid) to authenticated;
grant execute on function public.request_online_hint(uuid, uuid) to authenticated;
grant execute on function public.skip_online_word(uuid, uuid) to authenticated;
grant execute on function public.touch_online_participant(uuid) to authenticated;
grant execute on function public.leave_online_room(uuid) to authenticated;
grant execute on function public.prepare_online_rematch(uuid, boolean) to authenticated;

-- A limpeza pode ser chamada por uma tarefa protegida futura (pg_cron/Edge Function).
create or replace function public.cleanup_online_multiplayer_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.expire_online_rooms();
  delete from public.online_join_attempts where created_at < now() - interval '24 hours';
  delete from public.online_rooms where status in ('finished','cancelled','expired') and updated_at < now() - interval '7 days';
  delete from auth.users
  where is_anonymous is true
    and created_at < now() - interval '30 days'
    and not exists (select 1 from public.online_participants p where p.user_id = auth.users.id);
end;
$$;

revoke execute on function public.cleanup_online_multiplayer_data() from public, anon, authenticated;
