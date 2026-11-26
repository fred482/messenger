alter table public.profiles
  add column avatar_url text,
  add column status_text text not null default '',
  add constraint profiles_status_text_length check (char_length(status_text) <= 139);

grant update (display_name, avatar_url, status_text) on public.profiles to authenticated;

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop function public.find_profile_by_username(text);
create function public.find_profile_by_username(search_username text)
returns table (id uuid, username text, display_name text, avatar_url text, status_text text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.status_text
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

drop function public.list_my_contacts();
create function public.list_my_contacts()
returns table (id uuid, username text, display_name text, avatar_url text, status_text text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.status_text
  from public.contacts c
  join public.profiles p on p.id = c.contact_id
  where c.user_id = auth.uid()
  order by p.username;
$$;

revoke all on function public.list_my_contacts() from public, anon;
grant execute on function public.list_my_contacts() to authenticated;

create function public.get_my_profile()
returns table (id uuid, username text, display_name text, avatar_url text, status_text text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.status_text
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

create policy "Users can read their own profile photo objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own profile photo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own profile photo"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own profile photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
