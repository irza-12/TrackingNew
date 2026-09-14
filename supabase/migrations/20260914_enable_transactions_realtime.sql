-- Enable Supabase Realtime for cross-device transaction updates.
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