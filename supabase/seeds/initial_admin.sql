-- Crie primeiro o usuário no Supabase Auth com o e-mail abaixo.
-- A senha deve ser definida pelo painel do Supabase ou por um fluxo seguro do Auth.
--
-- E-mail do administrador inicial:
-- diretorsnow@coliseurp.br
--
-- Papel interno usado pelo sistema:
-- admin_general

do $$
declare
  target_user_id uuid;
begin
  select id
    into target_user_id
  from auth.users
  where email = 'diretorsnow@coliseurp.br'
  limit 1;

  if target_user_id is null then
    raise exception 'Usuário Auth não encontrado para diretorsnow@coliseurp.br. Crie o acesso no Supabase Auth antes de executar este script.';
  end if;

  insert into public.profiles (
    user_id,
    name,
    discord_name,
    discord_id,
    role
  )
  values (
    target_user_id,
    'Snow',
    null,
    null,
    'admin_general'
  )
  on conflict (user_id) do update
    set
      name = excluded.name,
      role = excluded.role;
end
$$;
