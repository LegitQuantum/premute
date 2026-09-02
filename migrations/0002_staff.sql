-- PremuteBOT panel: staff permissions, audit log, cached FEAR stats

create table if not exists staff (
  user_id         text primary key,
  display_name    text,
  email           text,
  image           text,
  discord_id      text,
  is_root         boolean not null default false,
  is_owner        boolean not null default false,
  can_stats       boolean not null default false,
  can_moderation  boolean not null default false,
  can_voice       boolean not null default false,
  created_at      timestamptz not null default now(),
  last_seen       timestamptz not null default now()
);

create index if not exists staff_discord_id_idx on staff (discord_id);

create table if not exists action_log (
  id          serial primary key,
  user_id     text not null,
  action      text not null,
  detail      text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists action_log_created_idx on action_log (created_at desc);

create table if not exists stats_cache (
  id          integer primary key check (id = 1),
  payload     text not null,
  updated_at  timestamptz not null default now()
);
