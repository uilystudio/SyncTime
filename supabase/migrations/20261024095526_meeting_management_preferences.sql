
alter table public.events add column closed_at timestamptz;
alter table public.events add column revision integer not null default 1 check(revision > 0);
alter table public.availability_slots add column is_preferred boolean not null default false;
