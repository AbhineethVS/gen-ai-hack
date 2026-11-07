alter table books
  add column if not exists cover_url text,
  add column if not exists cover_direction jsonb not null default '{}'::jsonb;

comment on column books.cover_url is
  'Dedicated text-free portrait cover illustration. Falls back to panel one when null.';

comment on column books.cover_direction is
  'LLM art direction: concept, illustration_prompt, focal_point, title_zone, and palette.';
