create unique index if not exists staff_discord_id_uidx
  on staff (discord_id)
  where discord_id is not null;
