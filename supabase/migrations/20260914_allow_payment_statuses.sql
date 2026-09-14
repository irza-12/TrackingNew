-- Keep the live database constraint aligned with schema.sql.
alter table public.transactions
  drop constraint if exists transactions_payment_status_check;

alter table public.transactions
  add constraint transactions_payment_status_check
  check (payment_status in (
    'Paid',
    'Unpaid / Payable',
    'Pending Reimbursement',
    'Deposit Deduction'
  ));