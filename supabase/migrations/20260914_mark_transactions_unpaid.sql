-- Run this once in Supabase SQL Editor for the existing KPR records.
-- This changes every existing transaction in this personal project to payable.
update public.transactions
set payment_status = 'Unpaid / Payable',
    updated_at = now()
where vendor = 'KPR';
