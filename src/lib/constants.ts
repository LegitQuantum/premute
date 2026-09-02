/** Hardcoded root owner — only this Discord ID can grant owner rights. */
export const ROOT_DISCORD_ID = "652399540384694292";

export const RANK_SHORT: Record<number, string> = {
  1: "мл. мод",
  2: "мод",
  3: "ст. мод",
  4: "админ",
  5: "стафф",
};

export const RANK_TITLE: Record<number, string> = {
  1: "Мл. Модератор",
  2: "Модератор",
  3: "Ст. Модератор",
  4: "Ст. Администратор",
  5: "Стафф",
};

export const SOUNDS = [
  { id: "eye", file: "eye.mp3", label: "Eye" },
  { id: "koza1", file: "koza1.mp3", label: "Koza 1" },
  { id: "koza2", file: "koza2.mp3", label: "Koza 2" },
  { id: "svin", file: "svin.mp3", label: "Svin" },
] as const;

export const MUTE_PRESETS = [
  { label: "10 мин", ms: 10 * 60 * 1000 },
  { label: "1 час", ms: 60 * 60 * 1000 },
  { label: "6 часов", ms: 6 * 60 * 60 * 1000 },
  { label: "24 часа", ms: 24 * 60 * 60 * 1000 },
  { label: "7 дней", ms: 7 * 24 * 60 * 60 * 1000 },
] as const;
