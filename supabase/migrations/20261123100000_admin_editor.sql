create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin')
);

alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

grant select on public.profiles to authenticated;

create policy "Admins can read profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "Admins can read all contacts"
  on public.contacts for select to authenticated
  using (public.is_admin());

create table public.site_settings (
  id smallint primary key check (id = 1),
  brand_name text not null default 'klartext' check (length(btrim(brand_name)) between 1 and 32),
  logo_text text not null default 'K' check (length(btrim(logo_text)) between 1 and 4),
  auth_heading text not null default 'Dein Konto. Deine Privatsphäre.' check (length(btrim(auth_heading)) between 1 and 80),
  auth_description text not null default 'Mit deiner E-Mail-Adresse und einem Passwort anmelden. Eine Telefonnummer oder 2FA brauchst du nicht.' check (length(btrim(auth_description)) between 1 and 240),
  accent_color text not null default '#277e66' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

insert into public.site_settings (id) values (1);

create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
