create table if not exists transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, meal_slot text not null check (meal_slot in ('Breakfast','Lunch','Dinner','Snack')), vendor text not null,
  plan_type text not null default 'Standard', pax numeric not null check (pax > 0), base_price numeric not null default 0 check (base_price >= 0),
  delivery_fee numeric not null default 0 check (delivery_fee >= 0), courier_type text not null default 'Internal Provider', shipping_distance_km numeric not null default 0,
  packaging_fee numeric not null default 0 check (packaging_fee >= 0), packaging_deposit numeric not null default 0 check (packaging_deposit >= 0), deposit_returned boolean not null default false,
  addon_items text not null default '', addon_price numeric not null default 0 check (addon_price >= 0), voucher_code text not null default '', discount numeric not null default 0 check (discount >= 0),
  payment_status text not null default 'Unpaid / Payable' check (payment_status in ('Paid','Unpaid / Payable','Pending Reimbursement','Deposit Deduction')), payment_method text not null default 'Bank Transfer' check (payment_method in ('Bank Transfer','E-Wallet','Prepaid Balance','Cash')),
  on_time_status text not null default 'On-Time' check (on_time_status in ('On-Time','Delayed','Missed')), quality_rating smallint not null default 5 check (quality_rating between 1 and 5),
  packaging_condition text not null default 'Intact' check (packaging_condition in ('Intact','Damaged/Spilled')), menu_notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists budgets (user_id uuid primary key references auth.users(id) on delete cascade, monthly_cap numeric not null default 1500000, updated_at timestamptz not null default now());
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Catering User',
  username text not null unique check (username ~ '^[a-z0-9_.]{3,24}$'),
  avatar_url text not null default '',
  updated_at timestamptz not null default now()
);
alter table transactions enable row level security; alter table budgets enable row level security;
alter table profiles enable row level security;
drop policy if exists select_own_transactions on transactions; drop policy if exists insert_own_transactions on transactions; drop policy if exists update_own_transactions on transactions; drop policy if exists delete_own_transactions on transactions;
create policy select_own_transactions on transactions for select using (auth.uid() = user_id); create policy insert_own_transactions on transactions for insert with check (auth.uid() = user_id); create policy update_own_transactions on transactions for update using (auth.uid() = user_id); create policy delete_own_transactions on transactions for delete using (auth.uid() = user_id);
drop policy if exists select_own_budget on budgets; drop policy if exists upsert_own_budget_insert on budgets; drop policy if exists upsert_own_budget_update on budgets;
create policy select_own_budget on budgets for select using (auth.uid() = user_id); create policy upsert_own_budget_insert on budgets for insert with check (auth.uid() = user_id); create policy upsert_own_budget_update on budgets for update using (auth.uid() = user_id);
drop policy if exists select_own_profile on profiles; drop policy if exists insert_own_profile on profiles; drop policy if exists update_own_profile on profiles;
create policy select_own_profile on profiles for select using (auth.uid() = id); create policy insert_own_profile on profiles for insert with check (auth.uid() = id); create policy update_own_profile on profiles for update using (auth.uid() = id);
create index if not exists idx_transactions_user_date on transactions(user_id, date); create index if not exists idx_transactions_user_vendor on transactions(user_id, vendor);
alter table public.transactions replica identity full;
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    execute 'alter publication supabase_realtime add table public.transactions';
  end if;
end $$;
