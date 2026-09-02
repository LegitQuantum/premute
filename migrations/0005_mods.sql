-- Права на управление списком модераторов FEAR + снимок состава

alter table staff add column if not exists can_mods boolean not null default false;

create table if not exists mod_roster (
  steamid  text primary key,
  name     text not null,
  rank     integer not null default 1,
  discord  text
);
