alter table public.panels
add column if not exists text_baked boolean not null default false;
