create table public.journal_entries (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

create function public.set_journal_entry_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_journal_entry_updated_at
before update on public.journal_entries
for each row
execute function public.set_journal_entry_updated_at();

alter table public.journal_entries enable row level security;

grant select, insert, update, delete on table public.journal_entries to authenticated;

create policy "Authenticated users can select their own journal entries"
on public.journal_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Authenticated users can insert their own journal entries"
on public.journal_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Authenticated users can update their own journal entries"
on public.journal_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own journal entries"
on public.journal_entries
for delete
to authenticated
using (auth.uid() = user_id);
