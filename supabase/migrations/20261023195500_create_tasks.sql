create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 500),
  due_date date not null,
  priority text not null check (priority in ('Low', 'Medium', 'High')) default 'Medium',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
grant select, insert, update, delete on table public.tasks to authenticated;

create trigger set_tasks_updated_at before update on public.tasks
for each row execute function public.set_journal_entry_updated_at();

create policy "Authenticated users can select their own tasks" on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy "Authenticated users can insert their own tasks" on public.tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users can update their own tasks" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Authenticated users can delete their own tasks" on public.tasks for delete to authenticated using (auth.uid() = user_id);
