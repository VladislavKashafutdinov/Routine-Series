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

  // Monitoring
  monitoringTitle: string;
  seriesHistoryTab: string;
  rewardHistoryTab: string;
  issueReward: string;
  earned: string;
  issued: string;
  unissued: string;

  // RewardHistory
  noRewardsYet: string;
  rewardDate: string;
  rewardAmount: string;
  rewardCurrency: string;
  rewardActions: string;

  // SeriesDefinitionTab
  editSeries: string;
  editSeriesSave: string;
  editSeriesCancel: string;
  defsTab: string;
  completionsTab: string;

  // Archive
  archiveTitle: string;
  archiveEmpty: string;
  restore: string;
  restoreConfirm: (name: string) => string;

  // LoginPage
  loginSendCode: string;
  loginEmailError: string;
  loginSendError: string;
  loginSentTo: (email: string) => string;
  loginVerifyCode: string;
  loginCodeError: string;
  loginResendCode: string;
  loginChangeEmail: string;
  loginRateLimit: string;
  loginWait: (n: number) => string;

  // AppHeader
  logoutButton: string;

  // Errors
  mutationError: string;
  mutationTimeout: string;
  loadErrorMessage: string;
  retryButton: string;

  // HistoryModal
  historyAria: (name: string) => string;
  daysSuffix: (n: number) => string;
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

  monitoringTitle: 'Monitoring',
  seriesHistoryTab: 'Series history',
  rewardHistoryTab: 'Reward history',
  issueReward: 'Issue reward',
  earned: 'Earned',
  issued: 'Issued',
  unissued: 'To issue',

  noRewardsYet: 'No rewards yet.',
  rewardDate: 'Date',
  rewardAmount: 'Amount',
  rewardCurrency: 'Cur.',
  rewardActions: 'Actions',

  editSeries: 'Edit series',
  editSeriesSave: 'Save',
  editSeriesCancel: 'Cancel',
  defsTab: 'Defs',
  completionsTab: 'Completions',

  archiveTitle: 'Archive',
  archiveEmpty: 'Archive is empty.',
  restore: 'Restore',
  restoreConfirm: (name: string) => `Restore "${name}"?`,

  loginSendCode: 'Send code',
  loginEmailError: 'Enter a valid email',
  loginSendError: 'Could not send the code. Try again later.',
  loginSentTo: (email: string) => `Code sent to ${email}`,
  loginVerifyCode: 'Sign in',
  loginCodeError: 'Invalid or expired code',
  loginResendCode: 'Resend code',
  loginChangeEmail: 'Change email',
  loginRateLimit: 'Too many requests. Try again later.',
  loginWait: (n: number) => `Wait ${n}s`,

  logoutButton: 'Sign out',

  mutationError: 'Could not save changes. Please try again.',
  mutationTimeout: 'The server is busy. Please try again in a moment.',
  loadErrorMessage: 'Could not load your data. Check the connection and try again.',
  retryButton: 'Retry',

  historyAria: (name: string) => `History for ${name}`,
  daysSuffix: (n: number) => enPlural(n, 'day', 'days'),
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

  monitoringTitle: 'Мониторинг',
  seriesHistoryTab: 'История серий',
  rewardHistoryTab: 'История начислений',
  issueReward: 'Начислить',
  earned: 'Заработано',
  issued: 'Начислено',
  unissued: 'К начислению',

  noRewardsYet: 'Начислений пока нет.',
  rewardDate: 'Дата',
  rewardAmount: 'Сумма',
  rewardCurrency: 'Вал.',
  rewardActions: 'Действия',

  editSeries: 'Изменить серию',
  editSeriesSave: 'Сохранить',
  editSeriesCancel: 'Отмена',
  defsTab: 'Параметры',
  completionsTab: 'Календарь',

  archiveTitle: 'Архив',
  archiveEmpty: 'Архив пуст.',
  restore: 'Восстановить',
  restoreConfirm: (name: string) => `Восстановить «${name}»?`,

  loginSendCode: 'Отправить код',
  loginEmailError: 'Введите корректный email',
  loginSendError: 'Не удалось отправить код. Попробуйте позже.',
  loginSentTo: (email: string) => `Код отправлен на ${email}`,
  loginVerifyCode: 'Войти',
  loginCodeError: 'Неверный или устаревший код',
  loginResendCode: 'Отправить код ещё раз',
  loginChangeEmail: 'Сменить email',
  loginRateLimit: 'Слишком много запросов. Попробуйте позже.',
  loginWait: (n: number) => `Подождите ${n} с`,

  logoutButton: 'Выйти',

  mutationError: 'Не удалось сохранить изменения. Попробуйте ещё раз.',
  mutationTimeout: 'Сервер занят. Попробуйте ещё раз через пару секунд.',
  loadErrorMessage: 'Не удалось загрузить данные. Проверьте соединение и повторите попытку.',
  retryButton: 'Повторить',

  historyAria: (name: string) => `История: ${name}`,
  daysSuffix: (n: number) => ruPlural(n, 'день', 'дня', 'дней'),
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
