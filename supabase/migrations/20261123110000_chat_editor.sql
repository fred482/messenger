alter table public.site_settings
  add column if not exists chat_banner text not null
    default 'Nachrichten werden nicht zugestellt und sind noch nicht Ende-zu-Ende-verschlüsselt.'
    check (length(btrim(chat_banner)) between 1 and 240);
