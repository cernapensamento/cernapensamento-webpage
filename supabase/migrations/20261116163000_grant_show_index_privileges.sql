-- Grant INSERT and UPDATE privileges on publications.show_index to authenticated users.
-- Migration 20261111220000 revoked table-level privileges and granted explicit column lists
-- before migration 20261115173500 added the show_index column.
GRANT INSERT (show_index), UPDATE (show_index) ON TABLE public.publications TO authenticated;
