-- Budget Planner — initial schema
--
-- Every table carries user_id (defaulted to auth.uid() so the client never
-- needs to send it) and is scoped by Row Level Security so a user can only
-- ever read/write their own rows. Run this once against a fresh Supabase
-- project via the SQL editor, or `supabase db push` if using the CLI.
--
-- Field names are adapted from the app's actual TypeScript types
-- (src/lib/types.ts) rather than a generic guess — see the comments below
-- on paycheck_categories, bills, and transactions for the specific
-- deviations and why.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- accounts
-- =========================================================================
create table public.accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  type       text not null check (type in (
               'checking', 'savings', 'credit_card', 'loan',
               'investment', 'other_asset', 'other_liability'
             )),
  balance    numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "accounts_insert_own" on public.accounts for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "accounts_update_own" on public.accounts for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "accounts_delete_own" on public.accounts for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- =========================================================================
-- goals
-- =========================================================================
create table public.goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name              text not null,
  target_amount     numeric(14,2) not null default 0 check (target_amount >= 0),
  current_amount    numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date       date,
  linked_account_id uuid not null references public.accounts(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index goals_user_id_idx on public.goals (user_id);
create index goals_linked_account_id_idx on public.goals (linked_account_id);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "goals_insert_own" on public.goals for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "goals_update_own" on public.goals for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "goals_delete_own" on public.goals for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- =========================================================================
-- paycheck_categories
--
-- Deviations from the originally requested field list, to match the app's
-- actual PaycheckCategory type (src/lib/types.ts):
--   * "percentage" -> "percent"
--   * "track_as_spending_budget" dropped: category_type already has a
--     'spending_budget' value, so a separate boolean would be redundant
--     and could drift out of sync with it.
-- =========================================================================
create table public.paycheck_categories (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  percent        numeric(5,2) not null default 0 check (percent >= 0 and percent <= 100),
  category_type  text not null default 'regular' check (category_type in ('regular', 'spending_budget', 'goal')),
  linked_goal_id uuid references public.goals(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index paycheck_categories_user_id_idx on public.paycheck_categories (user_id);
create index paycheck_categories_linked_goal_id_idx on public.paycheck_categories (linked_goal_id);

create trigger paycheck_categories_set_updated_at
  before update on public.paycheck_categories
  for each row execute function public.set_updated_at();

alter table public.paycheck_categories enable row level security;

create policy "paycheck_categories_select_own" on public.paycheck_categories for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "paycheck_categories_insert_own" on public.paycheck_categories for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "paycheck_categories_update_own" on public.paycheck_categories for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "paycheck_categories_delete_own" on public.paycheck_categories for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- =========================================================================
-- paychecks
--
-- A record of each paycheck actually applied, for future history/reporting.
-- Immutable once created (no updated_at), per the requested field list.
-- =========================================================================
create table public.paychecks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  amount     numeric(14,2) not null check (amount >= 0),
  pay_date   date not null,
  created_at timestamptz not null default now()
);

create index paychecks_user_id_idx on public.paychecks (user_id);

alter table public.paychecks enable row level security;

create policy "paychecks_select_own" on public.paychecks for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "paychecks_insert_own" on public.paychecks for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "paychecks_update_own" on public.paychecks for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "paychecks_delete_own" on public.paychecks for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- =========================================================================
-- bills
--
-- Deviations from the originally requested field list, to match the app's
-- actual Bill type (src/lib/types.ts): bills here are a percentage of the
-- paycheck due on a recurring day-of-month, not a fixed dollar amount due
-- on a calendar date.
--   * "amount"    -> "percent"   (% of paycheck reserved for this bill)
--   * "due_date"  -> "due_day"   (1-31, day of month)
--   * "status"    -> "is_paid"   (boolean, matches the app's toggle)
--   * "autopay" added — already exists on the app's Bill type
-- =========================================================================
create table public.bills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  percent    numeric(5,2) not null default 0 check (percent >= 0 and percent <= 100),
  due_day    smallint not null check (due_day between 1 and 31),
  frequency  text not null default 'monthly' check (frequency in ('monthly', 'weekly', 'yearly')),
  is_paid    boolean not null default false,
  autopay    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bills_user_id_idx on public.bills (user_id);

create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

alter table public.bills enable row level security;

create policy "bills_select_own" on public.bills for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "bills_insert_own" on public.bills for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "bills_update_own" on public.bills for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "bills_delete_own" on public.bills for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- =========================================================================
-- transactions
--
-- Keeps a free-text "category" column alongside paycheck_category_id: the
-- shared budget-matching logic in /lib/finance (getCategorySpending) matches
-- transactions to a spending-budget category by name, not by id, so dropping
-- it would break that logic once transactions are migrated to this table.
-- =========================================================================
create table public.transactions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id            uuid not null references public.accounts(id) on delete cascade,
  paycheck_category_id  uuid references public.paycheck_categories(id) on delete set null,
  category              text not null default 'Uncategorized',
  description           text not null,
  amount                numeric(14,2) not null,
  transaction_date      date not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_paycheck_category_id_idx on public.transactions (paycheck_category_id);
create index transactions_transaction_date_idx on public.transactions (transaction_date);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions for select
  to authenticated using ( (select auth.uid()) = user_id );
create policy "transactions_insert_own" on public.transactions for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "transactions_update_own" on public.transactions for update
  to authenticated using ( (select auth.uid()) = user_id ) with check ( (select auth.uid()) = user_id );
create policy "transactions_delete_own" on public.transactions for delete
  to authenticated using ( (select auth.uid()) = user_id );
