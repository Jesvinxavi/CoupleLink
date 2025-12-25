create table if not exists public.user_dates (
    id uuid not null default gen_random_uuid(),
    couple_id uuid not null,
    title text not null,
    description text not null,
    image_url text,
    duration text not null,
    cost text not null,
    checklist text[] default '{}'::text[],
    created_at timestamp with time zone not null default now(),
    constraint user_dates_pkey primary key (id),
    constraint user_dates_couple_id_fkey foreign key (couple_id) references public.couples (id) on delete cascade
);

-- Enable RLS
alter table public.user_dates enable row level security;

-- Policies
create policy "Users can view their own couple's dates"
    on public.user_dates for select
    using (auth.uid() in (
        select user_one_id from public.couples where id = user_dates.couple_id
        union
        select user_two_id from public.couples where id = user_dates.couple_id
    ));

create policy "Users can insert dates for their couple"
    on public.user_dates for insert
    with check (auth.uid() in (
        select user_one_id from public.couples where id = user_dates.couple_id
        union
        select user_two_id from public.couples where id = user_dates.couple_id
    ));

create policy "Users can update their own couple's dates"
    on public.user_dates for update
    using (auth.uid() in (
        select user_one_id from public.couples where id = user_dates.couple_id
        union
        select user_two_id from public.couples where id = user_dates.couple_id
    ));

create policy "Users can delete their own couple's dates"
    on public.user_dates for delete
    using (auth.uid() in (
        select user_one_id from public.couples where id = user_dates.couple_id
        union
        select user_two_id from public.couples where id = user_dates.couple_id
    ));
