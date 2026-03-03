alter table public.lesson_records
  add column if not exists content_items jsonb not null default '[]'::jsonb,
  add column if not exists page_items text[] not null default '{}',
  add column if not exists lesson_items text[] not null default '{}';

create index if not exists idx_lessons_content_items on public.lesson_records using gin (content_items);
create index if not exists idx_lessons_page_items on public.lesson_records using gin (page_items);
create index if not exists idx_lessons_lesson_items on public.lesson_records using gin (lesson_items);