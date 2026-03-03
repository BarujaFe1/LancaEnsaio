-- GEM V2 - expansão de alunos, professores, métodos e lançamentos

-- =========================================
-- STUDENTS: novos campos
-- category = família (Cordas / Metais / Madeiras)
-- level = graduação (Aluno / Toca nos Ensaios / etc.)
-- =========================================
alter table public.students
  add column if not exists congregation text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists birth_date date,
  add column if not exists baptism_date date,
  add column if not exists instrument_change_note text;

-- =========================================
-- PROFESSORES / ENCARREGADOS
-- =========================================
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  instrument text not null default '',
  congregation text,
  role_kind text not null default 'instrutor',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teachers_owner on public.teachers(owner_id);
create index if not exists idx_teachers_name on public.teachers(full_name);

drop trigger if exists trg_teachers_updated_at on public.teachers;
create trigger trg_teachers_updated_at
before update on public.teachers
for each row execute function public.set_updated_at();

create or replace function public.set_teacher_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_teachers_set_owner on public.teachers;
create trigger trg_teachers_set_owner
before insert on public.teachers
for each row execute function public.set_teacher_owner();

alter table public.teachers enable row level security;

drop policy if exists "teachers_select_own_or_admin" on public.teachers;
create policy "teachers_select_own_or_admin"
on public.teachers
for select
to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "teachers_insert_own_or_admin" on public.teachers;
create policy "teachers_insert_own_or_admin"
on public.teachers
for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "teachers_update_own_or_admin" on public.teachers;
create policy "teachers_update_own_or_admin"
on public.teachers
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "teachers_delete_own_or_admin" on public.teachers;
create policy "teachers_delete_own_or_admin"
on public.teachers
for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.teachers to authenticated;

-- =========================================
-- MÉTODOS
-- =========================================
create table if not exists public.methods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  instruments text[] not null default '{}',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_methods_owner on public.methods(owner_id);
create index if not exists idx_methods_name on public.methods(name);

drop trigger if exists trg_methods_updated_at on public.methods;
create trigger trg_methods_updated_at
before update on public.methods
for each row execute function public.set_updated_at();

create or replace function public.set_method_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_methods_set_owner on public.methods;
create trigger trg_methods_set_owner
before insert on public.methods
for each row execute function public.set_method_owner();

alter table public.methods enable row level security;

drop policy if exists "methods_select_own_or_admin" on public.methods;
create policy "methods_select_own_or_admin"
on public.methods
for select
to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "methods_insert_own_or_admin" on public.methods;
create policy "methods_insert_own_or_admin"
on public.methods
for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "methods_update_own_or_admin" on public.methods;
create policy "methods_update_own_or_admin"
on public.methods
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "methods_delete_own_or_admin" on public.methods;
create policy "methods_delete_own_or_admin"
on public.methods
for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.methods to authenticated;

-- =========================================
-- LESSON_RECORDS: novos campos
-- =========================================
alter table public.lesson_records
  add column if not exists teacher_id uuid references public.teachers(id) on delete set null,
  add column if not exists method_id uuid references public.methods(id) on delete set null,
  add column if not exists launched_at timestamptz not null default now(),
  add column if not exists content_group text,
  add column if not exists content_number integer,
  add column if not exists voices text[] not null default '{}',
  add column if not exists solfejo boolean not null default false;

create index if not exists idx_lessons_teacher on public.lesson_records(teacher_id);
create index if not exists idx_lessons_method on public.lesson_records(method_id);
create index if not exists idx_lessons_group_number on public.lesson_records(content_group, content_number);
--- fim ---
