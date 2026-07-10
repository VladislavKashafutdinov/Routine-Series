# Архив

Выполненные и отменённые задачи.

---

### 2026-07-11 — Баг: разрывы в SeriesProgress при перемотке времени

- SeriesProgress теперь получает completions текущей серии (по virtualToday), а не все

### 2026-07-10 — Баг: пропадала форма SeriesDefinition

- Убран флаг `expanded` в AddActivity, форма параметров всегда видна

### 2026-07-10 — Баг: пустой seriesDefinitions при добавлении активности

- Добавлены проверки на пустоту seriesDefinitions в ActivityCard, ActivityAccordion, EditSeriesDefinition, SeriesDefinitionTab
- При пустом списке показывается плейсхолдер вместо краша

### 2026-07-10 — Экспорт/Импорт

- 20. DataActions: экспорт всех таблиц БД в JSON, импорт с валидацией и подтверждением
- Конвертация Date при импорте (createdAt)

### 2026-07-10 — Список предложений к начислению + рефакторинг

- 19. IssueBanner: баннер на дашборде с unissued > 0, кнопки «Начислить»
- 18. RewardCounters в RewardHistoryTab с inline-кнопками «Начислить»
- 17. Хедер аккордеона: unissued per-currency, UnissuedRow
- Баг: исправлена перемотка времени (computeSeries в компоненте, текущая серия)
- Модель ActivityWithStreak очищена от dead fields
- Расчёт наград вынесен в utils/rewards.ts (calcEarnedByCurrency, calcIssuedByCurrency, calcUnissuedByCurrency, getCurrencies)
- SeriesWidget: только отображение, входные параметры — сырые данные

### 2026-07-09 — SeriesDefinitionTab, CompletionsTab, группировка

- 13. SeriesDefinitionTab: вкладка с историей SeriesDefinition + добавление
- 14. CompletionsTab: календарь completions по месяцам с тогглом
- 15. Группировка серий по SeriesDefinition в истории
- 16. Мультивалютные счётчики наград

### 2026-07-08 — Страница мониторинга (MonitoringPage)

- **10a. MonitoringPage + ActivityAccordion** — раскрывающиеся блоки, один открыт одновременно
- **10b. VirtualTodayContext** — замена TimeOffsetContext на виртуальное «сегодня»
- **10c. SeriesHistoryTab** — список SeriesWidget с пагинацией, визуальное различие по статусам
- **10d. IssueRewardModal** — модалка выдачи награды (дата/сумма/валюта)
- **10e. RewardHistoryTab** — таблица RewardIssue с inline-редактированием, удалением, пагинацией
- Извлечены 4 переиспользуемых компонента: RewardCounters, TabSwitcher, Paginator, EditableCell
- CSS разбит на 14 per-component файлов

### 2026-07-09 — Архив + SeriesDefinition + Node.js

- **11. EditSeriesDefinition** — inline-форма изменения параметров серии, версионирование
- **12. ArchivePage** — список архивных активностей, кнопка восстановления
- **9. Node.js** — апгрейд с v16 до v24 (ESLint заработал)
- README.md: актуализирован data flow, структура данных, индексы БД
- VISION.md + TARGET_SCHEMA.md: разделение фактического и целевого состояния

### 2026-07-03 — Сетка дней по размеру серии

- ActivityGroup: ряд квадратиков равен seriesLength (вместо фиксированного числа)
- HistoryModal: сетка теперь seriesLength вместо 60
- Каждый квадрат = один день серии, заполняется по мере выполнения

---

### 2026-07-03 — Дашборд

- RewardSummary: баннер с totals по валютам для незатребованных наград
- ActivityGroup: карточка активности с прогресс-баром, кнопкой, лентой последних серий
- Серии сгруппированы по активностям, каждая в своём блоке
- Цветовая индикация статусов серий (зелёный/красный/оранжевый)

---

### 2026-07-03 — Добавление/удаление дней в серии задним числом

- `toggleDate` в хуке: общая логика для любой даты, `toggleDone` через неё
- Сетка 60 дней в модалке стала кликабельной для активной серии
- Будущие даты заблокированы, прошлые и сегодня — кликабельны
- Визуал: активная серия (яркие), старые серии (блёклые), hover-эффект

---

### 2026-07-03 — Изменение доменной модели

- Activity: поля seriesLength, reward, currency
- Series: новая сущность (active/completed/broken, rewardIssued)
- Completion: связь с Series через seriesId
- Миграция БД v1→v2
- Логика жизненного цикла серии: авто-завершение, авто-срыв
- UI: прогресс-бар, кнопка «Получить награду», история серий в модалке
- AddActivity: выпадающие поля длины серии, награды, валюты

---

### 2026-07-03 — Локализация русский/английский

- Контекст `LocaleProvider` + `useLocale` hook
- Переводы en/ru: все строки интерфейса + русские plural-формы
- Автоопределение языка из браузера, сохранение в localStorage
- Кнопка переключения RU/EN в шапке
