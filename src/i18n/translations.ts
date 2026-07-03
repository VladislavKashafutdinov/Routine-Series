export type Lang = 'en' | 'ru';

/** Russian plural: 1 → "день", 2-4 → "дня", 5+ → "дней" */
export function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function enPlural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export interface Strings {
  // AddActivity
  addPlaceholder: string;
  addButton: string;
  addError: string;

  // StreakCard
  deleteConfirm: (name: string) => string;
  deleteTitle: string;
  streakDays: (n: number) => string;
  doneToday: string;
  markDone: string;

  // Dashboard
  loading: string;
  empty: string;

  // HistoryModal
  historyAria: (name: string) => string;
  currentStreak: string;
  daysSuffix: (n: number) => string;
  longestStreak: string;
  lastNDays: (n: number) => string;
}

const en: Strings = {
  addPlaceholder: 'New daily task…',
  addButton: '+ Add',
  addError: 'Enter a name',

  deleteConfirm: (name: string) => `Delete "${name}"?`,
  deleteTitle: 'Delete',
  streakDays: (n: number) => enPlural(n, 'day', 'days'),
  doneToday: '✓ Done today',
  markDone: 'Mark done',

  loading: 'Loading…',
  empty: 'No tasks yet. Add one above to get started.',

  historyAria: (name: string) => `History for ${name}`,
  currentStreak: 'Current streak:',
  daysSuffix: (n: number) => enPlural(n, 'day', 'days'),
  longestStreak: 'Longest streak:',
  lastNDays: (n: number) => `Last ${n} days`,
};

const ru: Strings = {
  addPlaceholder: 'Новая ежедневная задача…',
  addButton: '+ Добавить',
  addError: 'Введите название',

  deleteConfirm: (name: string) => `Удалить «${name}»?`,
  deleteTitle: 'Удалить',
  streakDays: (n: number) => ruPlural(n, 'день', 'дня', 'дней'),
  doneToday: '✓ Выполнено',
  markDone: 'Отметить',

  loading: 'Загрузка…',
  empty: 'Пока нет задач. Добавьте первую выше.',

  historyAria: (name: string) => `История: ${name}`,
  currentStreak: 'Текущая серия:',
  daysSuffix: (n: number) => ruPlural(n, 'день', 'дня', 'дней'),
  longestStreak: 'Лучшая серия:',
  lastNDays: (n: number) => `Последние ${n} ${ruPlural(n, 'день', 'дня', 'дней')}`,
};

export const translations: Record<Lang, Strings> = { en, ru };
