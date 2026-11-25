create or replace function public.find_profile_by_username(search_username text)
returns table (id uuid, username text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name
  from public.profiles p
  where auth.uid() is not null
    and p.username = lower(btrim(search_username))
    and p.id <> auth.uid()
    and exists (
      select 1
      from auth.users u
      where u.id = p.id
        and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
    )
  limit 1;
$$;

revoke all on function public.find_profile_by_username(text) from public, anon;
grant execute on function public.find_profile_by_username(text) to authenticated;
