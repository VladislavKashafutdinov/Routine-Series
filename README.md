# Routine Series

Трекер ежедневных серий (streak tracker). Приложение для отслеживания непрерывных цепочек повторяющихся ежедневных дел.

## Цель

Не выработка привычек, а мотивация через поощрение за непрерывное выполнение необходимых дел без пропусков. Если серия прерывается (день пропущен) — серия начинается заново. Награда — за длину серии без пропусков.

## Data flow

```
User action
  (add / toggle done / update name / delete / change virtual date)
  → ActivitiesProvider (useActivities читает общий контекст)
    → src/api/* → REST API (Go-бэкенд, PostgreSQL)
      → после каждой мутации load() перечитывает все данные с API
        → build() for each activity:
          - collects completions, rewardIssues, seriesDefinitions per activity
          - checks today's completion → isDoneToday
        → ActivityWithStreak[] computed (raw data, no derived fields)
          → Components call computeSeries() + calcEarnedByCurrency() etc.
            using current virtualToday from context
          → Components re-render with updated data
```

Все мутации данных проходят через `useActivities()` (ActivitiesProvider); напрямую с API работают только функции чтения/импорта-экспорта в `src/api/` и `DataActions`.
`computeSeries` вызывается в компонентах (ActivityAccordion, RewardCounters) с актуальным `virtualToday` из контекста — гарантирует консистентность при перемотке времени.
Расчёт наград (`calcEarnedByCurrency`, `calcIssuedByCurrency`, `calcUnissuedByCurrency`) — в `utils/rewards.ts`.
`TimeTravel` управляет `virtualToday` через `setVirtualToday`, вычисляя offset от реального `today()` только для отображения.

## Технологии

- **Фронтенд**: React SPA (Vite + TypeScript), без роутера
- **Бэкенд**: Go REST API + PostgreSQL (Render) — см. [backend/README.md](backend/README.md)
- **Связь**: fetch через `src/api/` — типы контракта (`types.ts`), маппинг snake_case → camelCase (`mapping.ts`), обёртка `apiFetch` (`fetch.ts`) и файлы функций по разделам API
- **Запуск**: фронтенд — `npm run dev`; бэкенд — `go run ./cmd/server` (в `backend/`)

## Реализованная схема вложенности компонентов

Актуально на момент последнего изменения кода. Обновляется после каждого выполненного пункта из TODO.md.

```
main.tsx
└── LocaleProvider
    └── VirtualTodayProvider
        └── AuthProvider             (проверка сессии через /auth/me, verify() — вход по коду, токены в localStorage)
            └── App                  (гейт: loading → LoadingOverlay, unauthenticated → LoginPage; данные грузятся только для авторизованного)
                ├── LoginPage        (вход по коду: форма email → форма кода → verify)
                └── ActivitiesProvider       (общее хранилище данных: загрузка из API + все мутации)
                    └── SeriesProvider       (computeSeries для всех активностей)
                        └── MainApp
                            ├── AppHeader
                            │   ├── LangSwitcher
                            │   ├── LogoutButton            («Выйти»: logout на сервер + очистка токенов)
                            │   ├── PageTabs                («Выполнение» | «Мониторинг» | «Архив»)
                            │   ├── DataActions             (⤓ экспорт / ⤒ импорт через API)
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
                            │   └── ActivityAccordion[]     (один открыт одновременно, computeSeries на месте)
                            │       ├── Header: activity.name + UnissuedRow[] (unissued > 0 per-currency) + текущая серия (SeriesWidget)
                            │       ├── UnissuedRow          (currency, amount, кнопка → IssueRewardModal)
                            │       ├── IssueRewardModal     (оверлей, initialCurrency + defaultAmount из пропсов)
                            │       ├── TabSwitcher         («Параметры» / «История серий» / «История начислений» / «Календарь»)
                            │       ├── [defs] SeriesDefinitionTab
                            │       │   ├── Таблица всех SeriesDefinition (длина / награда / валюта / дата / удалить)
                            │       │   └── Форма добавления нового (длина / награда / валюта)
                            │       ├── [series] SeriesHistoryTab
                            │       │   ├── Группы по SeriesDefinition (заголовок: длина · награда · дата)
                            │       │   │   └── SeriesWidget[]  (swidget__progress: даты + квадратики; swidget__badge: статус)
                            │       │   └── Paginator       (◀ N/M ▶)
                            │       ├── [rewards] RewardHistoryTab
                            │       │   ├── RewardCounters  (earned / issued / unissued по валютам)
                            │       │   ├── Таблица (дата | сумма | валюта | действия)
                            │       │   ├── EditableCell    (клик → input, Enter/blur → updateRewardIssue, Esc → отмена)
                            │       │   ├── DeleteButton    (confirm → deleteRewardIssue)
                            │       │   └── Paginator       (◀ N/M ▶)
                            │       └── [completions] CompletionsTab
                            │           ├── Календарь по месяцам (по 3 месяца, сетка)
                            │           ├── Клик по дню → тоггл completion
                            │           └── Пагинация (◀ ▶ по блокам)
                            │
                            ├── [«Архив»] ArchivePage
                            │   └── ArchivedActivityRow[]
                            │       ├── Название + количество completions
                            │       └── RestoreButton      (confirm → unarchiveActivity)
                            │
                            └── LoadingOverlay            (оверлей со спиннером при полной загрузке: auth/me или первичная загрузка данных)
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

### Хранение

Данные хранятся в PostgreSQL через REST API (Go-бэкенд, см. [backend/README.md](backend/README.md)).
Логическая модель та же, что описана выше; таблицы и миграции — в `backend/migrations/`.

API отдаёт поля в snake_case (`created_at`, `series_length`, `activity_id`, …), даты — строки RFC3339 / `YYYY-MM-DD`. Фронт конвертирует их в доменные типы через [src/api/mapping.ts](src/api/mapping.ts). Формат экспорта/импорта (`POST /api/v1/import`) — camelCase, совпадает с прежним форматом выгрузки.

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

## Деплой на GitHub Pages

Фронтенд деплоится автоматически при пуше в `master` — workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

Адрес бэкенда вшивается в бандл на этапе сборки из переменной `VITE_API_BASE_URL` ([src/api/fetch.ts](src/api/fetch.ts)). В CI значение берётся из GitHub-переменной репозитория:

- Задать: GitHub → Settings → Secrets and variables → Actions → Variables → `VITE_API_BASE_URL` (например, `https://routine-series.onrender.com`)
- Workflow передаёт её в шаг сборки: `VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}`
- Если переменная не задана, фронт обращается к API по относительному пути `/api/...` — на GitHub Pages это работать не будет; локально такие запросы обслуживает Vite-прокси

Бэкенд должен разрешать CORS с origin'а GitHub Pages — переменная `ALLOWED_ORIGINS` на бэке (по умолчанию включает `https://*.github.io`), см. [backend/README.md](backend/README.md).
