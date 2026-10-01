create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  category text not null check (category in ('Laptop', 'Phone', 'Tablet', 'Other')),
  site text not null,
  assignee text,
  department text,
  make text not null,
  model text not null,
  serial text,
  imei text,
  phone_number text,
  supplier text,
  cost numeric(12, 2),
  status text not null default 'In stock' check (status in ('Assigned', 'In stock', 'Returned', 'Repair', 'Retired')),
  condition text not null default 'Good',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acknowledgments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  employee_name text,
  employee_number text,
  position text,
  issue_date date not null default current_date,
  issued_by_name text not null default 'Avirash Sewcharran',
  issuer_signature_path text,
  signed_document_path text,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Signed', 'Returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;
alter table public.acknowledgments enable row level security;

create policy "Authenticated users can manage assets" on public.assets
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage acknowledgments" on public.acknowledgments
  for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('asset-acknowledgments', 'asset-acknowledgments', false)
on conflict (id) do update set public = false;

create policy "Authenticated users can read acknowledgment files" on storage.objects
  for select to authenticated
  using (bucket_id = 'asset-acknowledgments');

create policy "Authenticated users can upload acknowledgment files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'asset-acknowledgments');

create policy "Authenticated users can update acknowledgment files" on storage.objects
  for update to authenticated
  using (bucket_id = 'asset-acknowledgments')
  with check (bucket_id = 'asset-acknowledgments');
