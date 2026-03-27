create table if not exists user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade unique,
  target_countries text[] default '{"FR"}',
  sector text default 'Streetwear',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_preferences enable row level security;
