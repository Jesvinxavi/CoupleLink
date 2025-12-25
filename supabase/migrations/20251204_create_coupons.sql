-- Create coupons table
create table if not exists public.coupons (
    id uuid default gen_random_uuid() primary key,
    couple_id uuid references public.couples(id) on delete cascade not null,
    title text not null,
    description text,
    assigned_to uuid references auth.users(id) on delete set null, -- The user who can redeem this coupon
    status text default 'active' check (status in ('active', 'redeemed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    redeemed_at timestamp with time zone
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Policies
create policy "Couples can view their own coupons"
    on public.coupons for select
    using (auth.uid() in (
        select id from public.profiles where couple_id = coupons.couple_id
    ));

create policy "Couples can insert coupons"
    on public.coupons for insert
    with check (auth.uid() in (
        select id from public.profiles where couple_id = coupons.couple_id
    ));

create policy "Couples can update their own coupons"
    on public.coupons for update
    using (auth.uid() in (
        select id from public.profiles where couple_id = coupons.couple_id
    ));

create policy "Couples can delete their own coupons"
    on public.coupons for delete
    using (auth.uid() in (
        select id from public.profiles where couple_id = coupons.couple_id
    ));
