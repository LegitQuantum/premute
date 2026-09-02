create table if not exists discord_claims (
  id             text primary key,
  user_id        text not null,
  discord_id     text not null,
  dm_channel_id  text,
  dm_message_id  text,
  status         text not null default 'pending',
  error          text,
  created_at     timestamptz not null default now()
);

create index if not exists discord_claims_user_idx on discord_claims (user_id, created_at desc);
