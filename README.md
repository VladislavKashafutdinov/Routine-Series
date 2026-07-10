# Routine Series

Трекер ежедневных серий (streak tracker). Приложение для отслеживания непрерывных цепочек повторяющихся ежедневных дел.

## Цель

Не выработка привычек, а мотивация через поощрение за непрерывное выполнение необходимых дел без пропусков. Если серия прерывается (день пропущен) — серия начинается заново. Награда — за длину серии без пропусков.

## Data flow

```
User action
  (add / toggle done / update name / delete / change virtual date)
  → useActivities / VirtualTodayContext
    → Dexie CRUD on IndexedDB tables
      → liveQuery subscription fires (re-subscribes on virtualToday change)
        → build() for each activity:
          - finds latest SeriesDefinition → seriesLength, reward, currency
          - calls computeSeries(defs, completions, virtualToday) → ComputedSeries[]
          - derives currentStreak, longestStreak, totalEarned, totalIssued, totalUnissued
          - checks today's completion → isDoneToday
        → ActivityWithStreak[] computed
          → Components re-render with updated data
```

Все мутации данных проходят через `useActivities()` — компоненты никогда не обращаются к `db` напрямую.
Виртуальная дата `virtualToday` из `VirtualTodayContext` используется в `liveQuery` (для `computeSeries` и `isDoneToday`), в `toggleDone`, `addSeriesDefinition` и `IssueRewardModal`.
`TimeTravel` управляет `virtualToday` через `setVirtualToday`, вычисляя offset от реального `today()` только для отображения.

## Технологии

- **Первый этап**: React SPA (Vite + TypeScript), без сервера
- **Хранение данных**: IndexedDB (браузер), через Dexie.js
- **Запуск**: `npm run dev` — единая точка входа
- **В перспективе**: .NET backend API для синхронизации и доступа с любого устройства

## Реализованная схема вложенности компонентов

Актуально на момент последнего изменения кода. Обновляется после каждого выполненного пункта из TODO.md.

```
App
├── AppHeader
│   ├── LangSwitcher
│   ├── PageTabs                («Выполнение» | «Мониторинг» | «Архив»)
│   └── TimeTravel              (◀ YYYY-MM-DD ▶ «Сегодня», VirtualTodayContext)
│
├── [«Выполнение»] Dashboard
│   ├── AddActivity             (название + длина/награда/валюта)
│   ├── Section «Не выполнено»
│   │   └── ActivityCard[]
│   │       ├── EditableName    (inline-редактирование)
│   │       ├── SeriesProgress  (квадратики, без кликов)
│   │       ├── ToggleDoneBtn   («Отметить»)
│   │       └── DeleteButton    (×, с подтверждением)
│   └── Section «Выполнено»
│       └── ActivityCard[]
│           ├── EditableName
│           ├── SeriesProgress
│           ├── ToggleDoneBtn   («Отменить»)
│           └── DeleteButton
│
├── [«Мониторинг»] MonitoringPage
│   └── ActivityAccordion[]     (один открыт одновременно)
│       ├── Header: activity.name + RewardCounters + «Начислить»
│       ├── IssueRewardModal    (оверлей: дата/сумма/валюта → addRewardIssue)
│       ├── TabSwitcher         («Параметры» / «История серий» / «История начислений» / «Календарь»)
│       ├── [defs] SeriesDefinitionTab
│       │   ├── Таблица всех SeriesDefinition (длина / награда / валюта / дата)
│       │   └── Форма добавления нового (длина / награда / валюта)
│       ├── [series] SeriesHistoryTab
│       │   ├── Группы по SeriesDefinition (заголовок: длина · награда · дата)
│       │   │   └── SeriesWidget[]  (swidget__progress: даты + квадратики; swidget__badge: статус)
│       │   └── Paginator       (◀ N/M ▶)
│       ├── [rewards] RewardHistoryTab
│       │   ├── Таблица (дата | сумма | валюта | действия)
│       │   ├── EditableCell    (клик → input, Enter/blur → updateRewardIssue, Esc → отмена)
│       │   ├── DeleteButton    (confirm → deleteRewardIssue)
│       │   └── Paginator       (◀ N/M ▶)
│       └── [completions] CompletionsTab
│           ├── Календарь по месяцам (по 3 месяца, сетка)
│           ├── Клик по дню → тоггл completion
│           └── Пагинация (◀ ▶ по блокам)
│
└── [«Архив»] ArchivePage
    └── ArchivedActivityRow[]
        ├── Название + количество completions
        └── RestoreButton      (confirm → unarchiveActivity)
```

## Структура данных

**Activity** — повторяющаяся задача, которую пользователь должен выполнять каждый день (например, «Отжимания», «Чтение», «Уборка»).

```
Activity {
  id: number
  name: string               // название повторяющейся ежедневной задачи
  archived: boolean          // soft-delete: вместо удаления при наличии связанных записей
  createdAt: DateTime
}

SeriesDefinition {
  id: number
  activityId: number
  seriesLength: number      // целевая длина серии в днях
  reward: number            // награда за завершённую серию
  currency: string          // единица измерения награды
  createdAt: DateTime       // дата создания этой версии определения
}
```

**Completion** — отметка о том, что активность была выполнена в конкретную дату.

```
Completion {
  id: number
  activityId: number
  date: string (YYYY-MM-DD) // дата выполнения
}

RewardIssue {
  id: number
  activityId: number
  date: string (YYYY-MM-DD)  // дата выдачи награды
  amount: number             // размер выданной награды
  currency: string           // валюта
}
```

### Индексы и миграции (Dexie)

Текущая версия БД: **v2**.

| Таблица | Первичный ключ | Индексы |
|---|---|---|
| `activities` | `++id` (auto) | `name`, `createdAt` |
| `seriesDefinitions` | `++id` (auto) | `activityId`, `createdAt` |
| `completions` | `++id` (auto) | `activityId`, `date`, `[activityId+date]` (compound) |
| `rewardIssues` | `++id` (auto) | `activityId`, `date` |

Составной индекс `[activityId+date]` в `completions` обеспечивает эффективную проверку «была ли эта активность выполнена в эту дату» — одна операция `.where({activityId, date})` вместо перебора.

**Миграция v1 → v2:** при обновлении для каждой существующей активности создаётся `SeriesDefinition` с копией её старых параметров (`seriesLength`, `reward`, `currency`) и датой создания, равной дате создания активности.

### SeriesDefinition — версионирование параметров

У активности могут меняться длина серии, размер награды и валюта.
Каждое изменение создаёт новую запись `SeriesDefinition`.
На определённую дату может быть только одна актуальная `SeriesDefinition` —
та, которая была создана последней на момент этой даты (по `createdAt`).

При вычислении статуса серии на дату D используется `SeriesDefinition`,
актуальная на D. Это гарантирует, что старые серии сохраняют прежние параметры,
даже если активность потом изменили.

Такая схема требуется, чтобы:
- Можно было задним числом менять награды и длины серий — новые параметры
  применяются только к будущим дням, не ломая историю
- При перемотке времени (тестовый режим) на любой виртуальной дате
  отображалась корректная информация: актуальные на тот момент настройки,
  правильный статус серии, соответствующая награда

### RewardIssue — учёт выданных наград

`RewardIssue` — это запись о факте выдачи награды: когда, в каком размере
и в какой валюте была выдана награда за активность. Хранится в БД.

Информация о том, какая награда должна быть выдана за активность — **вычисляемая**.
Она получается путём сопоставления трёх источников:

- `Completion` — какие дни были выполнены
- `SeriesDefinition` — какие параметры серии действовали на тот момент
- `RewardIssue` — какие награды уже были выданы

Такой подход гарантирует корректный перерасчёт предполагаемых наград
при любых изменениях задним числом:
- Изменение `Completion` (добавили/удалили отметку дня)
- Изменение `SeriesDefinition` (поменяли длину или награду)
- Изменение `RewardIssue` (добавили/удалили запись о выдаче)
- Перемотка времени в целях тестирования
