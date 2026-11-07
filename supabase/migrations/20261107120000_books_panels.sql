create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title_ml text not null,
  title_en text,
  narrator_label text,
  original_text text,
  character_sheet jsonb not null,
  is_public boolean default false,
  is_demo boolean default false,
  consent_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists panels (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  idx int not null,
  caption_ml text not null,
  caption_en text,
  scene_description text not null,
  dialogue jsonb not null default '[]'::jsonb,
  image_url text,
  unique (book_id, idx)
);

-- Public read for library; writes go through service role in API routes
alter table books enable row level security;
alter table panels enable row level security;

create policy "Public can read public books"
  on books for select
  using (is_public = true);

create policy "Public can read panels of public books"
  on panels for select
  using (
    exists (
      select 1 from books b
      where b.id = panels.book_id and b.is_public = true
    )
  );
