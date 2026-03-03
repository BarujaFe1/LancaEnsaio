-- Para que serve: habilitar uso coletivo (tudo compartilhado) via Organização (ORG) + RLS.
-- Onde colar: Supabase > SQL Editor > Run (execute uma vez).
-- Resultado: alunos, métodos, professores e lançamentos ficam visíveis para todos membros da mesma organização.

create extension if not exists pgcrypto;

-- 1) Organização
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Membros
create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(org_id);

-- 3) Profiles: org_id
alter table public.profiles
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

-- 4) Adicionar org_id nas tabelas principais
alter table if exists public.students add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table if exists public.teachers add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table if exists public.methods add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table if exists public.lesson_records add column if not exists org_id uuid references public.organizations(id) on delete cascade;

create index if not exists idx_students_org on public.students(org_id);
create index if not exists idx_teachers_org on public.teachers(org_id);
create index if not exists idx_methods_org on public.methods(org_id);
create index if not exists idx_lessons_org on public.lesson_records(org_id);

-- 5) Funções utilitárias
create or replace function public.my_org_id()
returns uuid
language sql
stable
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_member_of_org(p_org uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.organization_members m
    where m.org_id = p_org and m.user_id = auth.uid()
  )
$$;

-- 6) Entrar por código (RPC)
create or replace function public.join_org_by_code(p_code text)
returns table(org_id uuid, org_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  select * into v_org
  from public.organizations
  where join_code = p_code
  limit 1;

  if v_org.id is null then
    raise exception 'Código inválido.';
  end if;

  update public.profiles
    set org_id = v_org.id
    where id = auth.uid();

  insert into public.organization_members(org_id, user_id, member_role)
  values (v_org.id, auth.uid(), 'member')
  on conflict do nothing;

  return query select v_org.id, v_org.name;
end;
$$;

-- 7) Trigger: preencher org_id automaticamente ao inserir
create or replace function public.set_org_id_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select public.my_org_id() into v_org;

  if v_org is null then
    raise exception 'Você ainda não entrou na equipe. Vá em Configurações → Equipe e informe o código.';
  end if;

  new.org_id := v_org;
  return new;
end;
$$;

drop trigger if exists trg_students_set_org on public.students;
create trigger trg_students_set_org
before insert on public.students
for each row execute function public.set_org_id_from_profile();

drop trigger if exists trg_teachers_set_org on public.teachers;
create trigger trg_teachers_set_org
before insert on public.teachers
for each row execute function public.set_org_id_from_profile();

drop trigger if exists trg_methods_set_org on public.methods;
create trigger trg_methods_set_org
before insert on public.methods
for each row execute function public.set_org_id_from_profile();

drop trigger if exists trg_lessons_set_org on public.lesson_records;
create trigger trg_lessons_set_org
before insert on public.lesson_records
for each row execute function public.set_org_id_from_profile();

-- 8) RLS: habilitar
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.methods enable row level security;
alter table public.lesson_records enable row level security;

-- 9) Policies ORG
drop policy if exists org_select_member on public.organizations;
create policy org_select_member
on public.organizations
for select
to authenticated
using (public.is_member_of_org(id));

drop policy if exists org_members_select_self on public.organization_members;
create policy org_members_select_self
on public.organization_members
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists org_members_insert_self on public.organization_members;
create policy org_members_insert_self
on public.organization_members
for insert
to authenticated
with check (user_id = auth.uid());

-- Students policies
drop policy if exists students_select_org on public.students;
create policy students_select_org
on public.students
for select
to authenticated
using (public.is_member_of_org(org_id));

drop policy if exists students_insert_org on public.students;
create policy students_insert_org
on public.students
for insert
to authenticated
with check (public.is_member_of_org(org_id));

drop policy if exists students_update_org on public.students;
create policy students_update_org
on public.students
for update
to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

drop policy if exists students_delete_org on public.students;
create policy students_delete_org
on public.students
for delete
to authenticated
using (public.is_member_of_org(org_id));

-- Teachers policies
drop policy if exists teachers_select_org on public.teachers;
create policy teachers_select_org
on public.teachers
for select
to authenticated
using (public.is_member_of_org(org_id));

drop policy if exists teachers_insert_org on public.teachers;
create policy teachers_insert_org
on public.teachers
for insert
to authenticated
with check (public.is_member_of_org(org_id));

drop policy if exists teachers_update_org on public.teachers;
create policy teachers_update_org
on public.teachers
for update
to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

drop policy if exists teachers_delete_org on public.teachers;
create policy teachers_delete_org
on public.teachers
for delete
to authenticated
using (public.is_member_of_org(org_id));

-- Methods policies
drop policy if exists methods_select_org on public.methods;
create policy methods_select_org
on public.methods
for select
to authenticated
using (public.is_member_of_org(org_id));

drop policy if exists methods_insert_org on public.methods;
create policy methods_insert_org
on public.methods
for insert
to authenticated
with check (public.is_member_of_org(org_id));

drop policy if exists methods_update_org on public.methods;
create policy methods_update_org
on public.methods
for update
to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

drop policy if exists methods_delete_org on public.methods;
create policy methods_delete_org
on public.methods
for delete
to authenticated
using (public.is_member_of_org(org_id));

-- Lessons policies
drop policy if exists lessons_select_org on public.lesson_records;
create policy lessons_select_org
on public.lesson_records
for select
to authenticated
using (public.is_member_of_org(org_id));

drop policy if exists lessons_insert_org on public.lesson_records;
create policy lessons_insert_org
on public.lesson_records
for insert
to authenticated
with check (public.is_member_of_org(org_id));

drop policy if exists lessons_update_org on public.lesson_records;
create policy lessons_update_org
on public.lesson_records
for update
to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

drop policy if exists lessons_delete_org on public.lesson_records;
create policy lessons_delete_org
on public.lesson_records
for delete
to authenticated
using (public.is_member_of_org(org_id));

-- 10) Criar ORG padrão do GEM + backfill para tornar tudo coletivo
insert into public.organizations(name, join_code)
values ('GEM - Vargem Grande do Sul', 'GEMVGS-2026')
on conflict (join_code) do nothing;

do $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations where join_code = 'GEMVGS-2026' limit 1;

  update public.profiles set org_id = v_org where org_id is null;

  insert into public.organization_members(org_id, user_id, member_role)
  select v_org, p.id, 'member' from public.profiles p
  on conflict do nothing;

  update public.students set org_id = v_org where org_id is null;
  update public.teachers set org_id = v_org where org_id is null;
  update public.methods set org_id = v_org where org_id is null;
  update public.lesson_records set org_id = v_org where org_id is null;
end $$;

grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.teachers to authenticated;
grant select, insert, update, delete on public.methods to authenticated;
grant select, insert, update, delete on public.lesson_records to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select on public.organizations to authenticated;
grant execute on function public.join_org_by_code(text) to authenticated;
