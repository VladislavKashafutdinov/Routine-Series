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
  addErrorLength: string;
  seriesLengthLabel: string;
  rewardLabel: string;
  currencyLabel: string;

  // StreakCard
  deleteConfirm: (name: string) => string;
  deleteTitle: string;
  streakDays: (n: number) => string;
  doneToday: string;
  markDone: string;
  claimReward: string;

  // Dashboard
  loading: string;
  empty: string;
  pendingTitle: string;
  doneTitle: string;

  // HistoryModal
  historyAria: (name: string) => string;
  currentStreak: string;
  daysSuffix: (n: number) => string;
  longestStreak: string;
  lastNDays: (n: number) => string;
  seriesHistory: string;
  noSeriesYet: string;
  statusCompleted: string;
  statusBroken: string;
  statusActive: string;
  statusRewardClaimed: string;
  clickToToggle: string;
  unclaimedRewards: string;
}

const en: Strings = {
  addPlaceholder: 'New daily task…',
  addButton: '+ Add',
  addError: 'Enter a name',
  addErrorLength: 'Series length must be at least 1',
  seriesLengthLabel: 'Days',
  rewardLabel: 'Reward',
  currencyLabel: 'Currency',

  deleteConfirm: (name: string) => `Delete "${name}"?`,
  deleteTitle: 'Delete',
  streakDays: (n: number) => enPlural(n, 'day', 'days'),
  doneToday: '✓ Done today',
  markDone: 'Mark done',
  claimReward: 'Claim reward',

  loading: 'Loading…',
  empty: 'No tasks yet. Add one above to get started.',
  pendingTitle: 'Not done',
  doneTitle: 'Done',

  historyAria: (name: string) => `History for ${name}`,
  currentStreak: 'Current streak:',
  daysSuffix: (n: number) => enPlural(n, 'day', 'days'),
  longestStreak: 'Longest streak:',
  lastNDays: (n: number) => `Last ${n} days`,
  seriesHistory: 'Series history',
  noSeriesYet: 'No series yet.',
  statusCompleted: 'Completed ✓',
  statusBroken: 'Broken ✗',
  statusActive: 'Active',
  statusRewardClaimed: 'Reward claimed ✓',
  clickToToggle: 'Click to toggle',
  unclaimedRewards: 'To claim',
};

const ru: Strings = {
  addPlaceholder: 'Новая ежедневная задача…',
  addButton: '+ Добавить',
  addError: 'Введите название',
  addErrorLength: 'Длина серии должна быть не менее 1',
  seriesLengthLabel: 'Дней',
  rewardLabel: 'Награда',
  currencyLabel: 'Валюта',

  deleteConfirm: (name: string) => `Удалить «${name}»?`,
  deleteTitle: 'Удалить',
  streakDays: (n: number) => ruPlural(n, 'день', 'дня', 'дней'),
  doneToday: '✓ Выполнено',
  markDone: 'Отметить',
  claimReward: 'Получить награду',

  loading: 'Загрузка…',
  empty: 'Пока нет задач. Добавьте первую выше.',
  pendingTitle: 'Не выполнено',
  doneTitle: 'Выполнено',

  historyAria: (name: string) => `История: ${name}`,
  currentStreak: 'Текущая серия:',
  daysSuffix: (n: number) => ruPlural(n, 'день', 'дня', 'дней'),
  longestStreak: 'Лучшая серия:',
  lastNDays: (n: number) => `Последние ${n} ${ruPlural(n, 'день', 'дня', 'дней')}`,
  seriesHistory: 'История серий',
  noSeriesYet: 'Серий пока нет.',
  statusCompleted: 'Завершена ✓',
  statusBroken: 'Прервана ✗',
  statusActive: 'Активна',
  statusRewardClaimed: 'Награда получена ✓',
  clickToToggle: 'Кликните для переключения',
  unclaimedRewards: 'К начислению',
};

export const translations: Record<Lang, Strings> = { en, ru };
