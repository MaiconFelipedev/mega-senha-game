-- Endurece os privilégios do multiplayer para o mínimo necessário.
-- O cliente autenticado lê apenas o estado público da sala; toda escrita
-- continua passando pelas RPCs SECURITY DEFINER protegidas por auth.uid().

revoke all on table
  public.online_words,
  public.online_rooms,
  public.online_participants,
  public.online_games,
  public.online_game_words,
  public.online_messages,
  public.online_join_attempts,
  public.online_room_seen_words
from anon, authenticated;

grant select on table
  public.online_rooms,
  public.online_participants,
  public.online_games,
  public.online_messages
to authenticated;

revoke all on sequence public.online_join_attempts_id_seq
from anon, authenticated;
