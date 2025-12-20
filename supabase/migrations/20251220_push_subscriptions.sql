-- Table for storing Web Push subscriptions
create table if not exists public.push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, subscription)
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies
create policy "Users can manage their own subscriptions"
    on public.push_subscriptions
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
