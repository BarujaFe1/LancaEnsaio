-- GEM - Grupo de Estudos Musicais
-- Banco de dados + segurança (Supabase/PostgreSQL)
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

-- =========================
-- ENUMS
-- =========================
do $$ begin
  create type public.user_role as enum ('admin', 'instrutor');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.student_status as enum ('ativo', 'inativo');
exception when duplicate_object then null;
end $$;

-- =========================
-- TABELAS
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'instrutor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  instrument text not null default '',
  category text not null default '',
  level text not null default '',
  start_date date not null default current_date,
  status public.student_status not null default 'ativo',
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  instructor_id uuid not null references auth.users(id) on delete cascade,
  lesson_date date not null default current_date,

  method_name text,
  pages text,
  lesson_name text,
  hymns text,

  technical_notes text,
  performance_score numeric(4,2) check (performance_score is null or (performance_score >= 0 and performance_score <= 10)),
  performance_concept text,
  difficulty_observed text,
  strengths text,

  attendance boolean not null default true,

  skill_rhythm smallint check (skill_rhythm is null or (skill_rhythm between 0 and 10)),
  skill_reading smallint check (skill_reading is null or (skill_reading between 0 and 10)),
  skill_technique smallint check (skill_technique is null or (skill_technique between 0 and 10)),
  skill_posture smallint check (skill_posture is null or (skill_posture between 0 and 10)),
  skill_musicality smallint check (skill_musicality is null or (skill_musicality between 0 and 10)),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- ÍNDICES
-- =========================
create index if not exists idx_students_owner on public.students(owner_id);
create index if not exists idx_students_name on public.students(full_name);
create index if not exists idx_students_filters on public.students(instrument, category, level, status);
create index if not exists idx_lessons_student on public.lesson_records(student_id);
create index if not exists idx_lessons_instructor on public.lesson_records(instructor_id);
create index if not exists idx_lessons_date on public.lesson_records(lesson_date);

-- =========================
-- TRIGGER updated_at
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_lessons_updated_at on public.lesson_records;
create trigger trg_lessons_updated_at
before update on public.lesson_records
for each row execute function public.set_updated_at();

-- =========================
-- PERFIL AUTOMÁTICO NO SIGNUP
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'instrutor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_gem on auth.users;
create trigger on_auth_user_created_gem
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- FUNÇÕES AUXILIARES (RLS)
-- =========================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- =========================
-- ROW LEVEL SECURITY
-- =========================
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.lesson_records enable row level security;

-- PROFILES
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

-- STUDENTS
drop policy if exists "students_select_own_or_admin" on public.students;
create policy "students_select_own_or_admin"
on public.students
for select
to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "students_insert_own_or_admin" on public.students;
create policy "students_insert_own_or_admin"
on public.students
for insert
to authenticated
with check (
  (owner_id = auth.uid() or public.is_admin())
  and (owner_id is not null)
);

drop policy if exists "students_update_own_or_admin" on public.students;
create policy "students_update_own_or_admin"
on public.students
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "students_delete_own_or_admin" on public.students;
create policy "students_delete_own_or_admin"
on public.students
for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin());

-- Garante owner_id automático ao inserir (se não informado no app)
create or replace function public.set_student_owner()
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

drop trigger if exists trg_students_set_owner on public.students;
create trigger trg_students_set_owner
before insert on public.students
for each row execute function public.set_student_owner();

-- LESSON_RECORDS
drop policy if exists "lessons_select_by_student_owner_or_admin" on public.lesson_records;
create policy "lessons_select_by_student_owner_or_admin"
on public.lesson_records
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.students s
    where s.id = lesson_records.student_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "lessons_insert_by_owner_or_admin" on public.lesson_records;
create policy "lessons_insert_by_owner_or_admin"
on public.lesson_records
for insert
to authenticated
with check (
  (instructor_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.students s
    where s.id = lesson_records.student_id
      and (s.owner_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "lessons_update_by_owner_or_admin" on public.lesson_records;
create policy "lessons_update_by_owner_or_admin"
on public.lesson_records
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.students s
    where s.id = lesson_records.student_id
      and s.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.students s
    where s.id = lesson_records.student_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "lessons_delete_by_owner_or_admin" on public.lesson_records;
create policy "lessons_delete_by_owner_or_admin"
on public.lesson_records
for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.students s
    where s.id = lesson_records.student_id
      and s.owner_id = auth.uid()
  )
);

-- Garante instructor_id automático ao inserir
create or replace function public.set_lesson_instructor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.instructor_id is null then
    new.instructor_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lessons_set_instructor on public.lesson_records;
create trigger trg_lessons_set_instructor
before insert on public.lesson_records
for each row execute function public.set_lesson_instructor();

-- =========================
-- VIEW (apoio para consultas futuras)
-- =========================
create or replace view public.v_students_last_lesson as
select
  s.id as student_id,
  s.full_name,
  s.instrument,
  s.category,
  s.level,
  s.status,
  max(l.lesson_date) as last_lesson_date,
  count(l.id) as total_records
from public.students s
left join public.lesson_records l on l.student_id = s.id
group by s.id, s.full_name, s.instrument, s.category, s.level, s.status;

-- =========================
-- PERMISSÕES (SUPABASE)
-- =========================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.lesson_records to authenticated;
grant select on public.v_students_last_lesson to authenticated;
grant execute on function public.is_admin() to authenticated;
