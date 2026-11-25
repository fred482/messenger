create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_display_name_not_empty check (length(btrim(display_name)) > 0)
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;

create table public.contacts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, contact_id),
  constraint contacts_cannot_add_self check (user_id <> contact_id)
);

alter table public.contacts enable row level security;
grant select, insert, delete on public.contacts to authenticated;

create policy "Users can read their own contacts"
  on public.contacts for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own contacts"
  on public.contacts for insert to authenticated
  with check (auth.uid() = user_id and auth.uid() <> contact_id);

create policy "Users can remove their own contacts"
  on public.contacts for delete to authenticated
  using (auth.uid() = user_id);

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_username text := lower(btrim(new.raw_user_meta_data ->> 'username'));
  normalized_display_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  if normalized_username is null or normalized_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'INVALID_USERNAME';
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, normalized_username, coalesce(normalized_display_name, normalized_username));

  return new;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'USERNAME_TAKEN';
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create function public.is_username_available(candidate_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    btrim(candidate_username) ~ '^[a-zA-Z0-9_]{3,24}$'
    and not exists (
      select 1
      from public.profiles p
      where p.username = lower(btrim(candidate_username))
    ),
    false
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

create function public.find_profile_by_username(search_username text)
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

create function public.list_my_contacts()
returns table (id uuid, username text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name
  from public.contacts c
  join public.profiles p on p.id = c.contact_id
  where c.user_id = auth.uid()
  order by p.username;
$$;

revoke all on function public.list_my_contacts() from public, anon;
grant execute on function public.list_my_contacts() to authenticated;
