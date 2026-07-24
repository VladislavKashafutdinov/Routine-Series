# План: Go-бекенд + SQLite для Routine Series

План перехода от чисто клиентского приложения (React SPA + IndexedDB) к клиент-серверной архитектуре (React SPA + Go API + SQLite).

---

## Итоговая архитектура

```
┌─────────────────────────┐       JSON/HTTP        ┌──────────────────────┐
│  React SPA              │ ◄────────────────────► │  Go API server       │
│  GitHub Pages (статич.)  │    JWT в заголовке     │  (Railway/Render)    │
│                         │    CORS                 │                      │
│  - UI компоненты        │                        │  - REST хендлеры     │
│  - VirtualTodayContext   │                        │  - computeSeries()   │
│  - i18n                  │                        │  - JWT middleware     │
│  - API client (fetch)    │                        │  - CORS middleware    │
└─────────────────────────┘                        │            │         │
                                                    │       ┌────▼─────┐   │
                                                    │       │ SQLite   │   │
                                                    │       │ (файл)   │   │
                                                    │       └──────────┘   │
                                                    └──────────────────────┘
```

### Что движется на сервер

| Сейчас (клиент) | Станет (сервер) |
|---|---|
| `useActivities()` — прямые вызовы Dexie | API client — fetch-обёртка |
| `computeSeries()` в `utils/series.ts` | Go-функция в `internal/logic/series.go` |
| `calcEarnedByCurrency()` и др. в `utils/rewards.ts` | Go-функции в `internal/logic/rewards.go` |
| `db.ts` — Dexie instance | `db.go` — SQLite connection + миграции |
| Нет авторизации | JWT auth (login/register/refresh) |

### Что остаётся на клиенте

- Все React-компоненты (UI)
- `VirtualTodayContext` (перемотка времени)
- i18n (`LocaleContext`, переводы)
- Формат даты для отображения (но не для вычислений)

---

## Этап 1. Сервер: структура и БД

### 1.1. Структура Go-проекта

```
server/
├── main.go
├── go.mod
├── go.sum
├── internal/
│   ├── db/
│   │   ├── db.go              # Подключение SQLite, WAL-режим
│   │   └── migrate.go         # Создание таблиц, индексов
│   ├── models/
│   │   └── models.go          # Go-структуры + JSON-теги
│   ├── auth/
│   │   ├── jwt.go             # Создание/проверка JWT
│   │   └── middleware.go      # Middleware: извлечение user_id из токена
│   ├── handlers/
│   │   ├── auth.go            # POST /api/auth/register, /login
│   │   ├── activities.go      # CRUD активностей
│   │   ├── completions.go     # Тоггл/список completions
│   │   ├── series.go          # GET /api/activities/:id/series
│   │   ├── definitions.go     # CRUD SeriesDefinition
│   │   └── rewards.go         # CRUD RewardIssue + вычисление earned/issued/unissued
│   └── logic/
│       ├── series.go          # computeSeries (порт из TypeScript)
│       └── rewards.go         # calcEarned/Issued/Unissued (порт из TypeScript)
├── cmd/
│   └── migrate/
│       └── main.go            # Утилита для ручного запуска миграций (опционально)
└── Dockerfile                 # Для деплоя
```

**Что освоишь**: структура Go-проекта, пакеты, `go mod init`, импорты.

### 1.2. Схема SQLite

```sql
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,              -- bcrypt hash
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE activities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    archived    INTEGER NOT NULL DEFAULT 0,  -- boolean: 0/1
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_activities_user ON activities(user_id);

CREATE TABLE series_definitions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id   INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    series_length INTEGER NOT NULL,
    reward        REAL NOT NULL,
    currency      TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_defs_activity ON series_definitions(activity_id);

CREATE TABLE completions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,              -- "YYYY-MM-DD"
    UNIQUE(activity_id, date)
);
CREATE INDEX idx_comps_activity_date ON completions(activity_id, date);

CREATE TABLE reward_issues (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    amount      REAL NOT NULL,
    currency    TEXT NOT NULL
);
CREATE INDEX idx_issues_activity ON reward_issues(activity_id);
```

**Отличия от IndexedDB-схемы:**
- Добавлена таблица `users`
- `user_id` во всех таблицах — для мульти-пользовательской изоляции
- `archived` стал `INTEGER` (0/1) — в SQLite нет булева типа
- `REAL` вместо `number` для наград
- `UNIQUE(activity_id, date)` вместо составного индекса — гарантирует одну отметку в день
- `ON DELETE CASCADE` — при удалении активности авто-удаляются связанные записи
- Даты как `TEXT` — SQLite не имеет типа DATE, строки с `YYYY-MM-DD` корректно сортируются

### 1.3. Go-модели

```go
package models

type User struct {
    ID        int    `json:"id"`
    Email     string `json:"email"`
    Password  string `json:"-"`              // никогда не сериализуется в JSON
    CreatedAt string `json:"createdAt"`
}

type Activity struct {
    ID        int    `json:"id"`
    UserID    int    `json:"userId"`
    Name      string `json:"name"`
    Archived  bool   `json:"archived"`
    CreatedAt string `json:"createdAt"`
}

type SeriesDefinition struct {
    ID           int     `json:"id"`
    ActivityID   int     `json:"activityId"`
    SeriesLength int     `json:"seriesLength"`
    Reward       float64 `json:"reward"`
    Currency     string  `json:"currency"`
    CreatedAt    string  `json:"createdAt"`
}

type Completion struct {
    ID         int    `json:"id"`
    ActivityID int    `json:"activityId"`
    Date       string `json:"date"`          // "YYYY-MM-DD"
}

type RewardIssue struct {
    ID         int     `json:"id"`
    ActivityID int     `json:"activityId"`
    Date       string  `json:"date"`
    Amount     float64 `json:"amount"`
    Currency   string  `json:"currency"`
}

// Computed на сервере — не хранится в БД
type ComputedSeries struct {
    Number               int          `json:"number"`
    Status               string       `json:"status"`  // "active" | "completed" | "broken"
    SeriesLength         int          `json:"seriesLength"`
    Reward               float64      `json:"reward"`
    Currency             string       `json:"currency"`
    StartDate            string       `json:"startDate"`
    EndDate              *string      `json:"endDate"` // null для active
    Completions          []Completion `json:"completions"`
    DefinitionCreatedAt  string       `json:"definitionCreatedAt"`
}

// Activity со всеми связанными данными (аналог ActivityWithStreak)
type ActivityFull struct {
    Activity
    SeriesDefinitions []SeriesDefinition `json:"seriesDefinitions"`
    Completions       []Completion       `json:"completions"`
    RewardIssues      []RewardIssue      `json:"rewardIssues"`
}
```

**Что освоишь**: struct-теги, экспорт через заглавные буквы, указатели для nullable-полей.

### 1.4. Подключение к БД

```go
package db

import (
    "database/sql"
    _ "modernc.org/sqlite"    // чистый Go-драйвер
)

var DB *sql.DB

func Open(path string) error {
    var err error
    DB, err = sql.Open("sqlite", path)
    if err != nil {
        return err
    }
    // WAL-режим: читатели не блокируют писателя
    _, err = DB.Exec("PRAGMA journal_mode=WAL")
    if err != nil {
        return err
    }
    // Внешние ключи включены
    _, err = DB.Exec("PRAGMA foreign_keys=ON")
    if err != nil {
        return err
    }
    return migrate()
}
```

**Что освоишь**: `database/sql` — стандартный интерфейс БД в Go, prepared statements.

---

## Этап 2. REST API

Все эндпоинты, кроме `/api/auth/*`, требуют заголовок `Authorization: Bearer <JWT>`.

### 2.1. Аутентификация

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{email, password}` | `{token, refreshToken}` |
| `POST` | `/api/auth/login` | `{email, password}` | `{token, refreshToken}` |
| `POST` | `/api/auth/refresh` | `{refreshToken}` | `{token, refreshToken}` |

JWT: access token живёт 15 минут, refresh token — 30 дней. Пароль хранится как bcrypt-хеш.

**Что освоишь**: JWT (HS256), bcrypt, middleware-паттерн.

### 2.2. Активности

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/activities` | Список активностей пользователя + связанные данные |
| `POST` | `/api/activities` | Создать активность + начальный SeriesDefinition |
| `PUT` | `/api/activities/:id` | Обновить (name / archived) |
| `DELETE` | `/api/activities/:id` | Удалить (soft если есть completions, иначе hard) |

`GET /api/activities` возвращает `ActivityFull[]` — полные данные для всего дашборда за один запрос (как сейчас делает `liveQuery`).

### 2.3. Отметки выполнения

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/activities/:id/completions` | Тоггл: `{date}` — добавить если нет, удалить если есть |
| `GET` | `/api/activities/:id/completions` | Список отметок активности |

### 2.4. SeriesDefinition

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/activities/:id/definitions` | Список определений |
| `POST` | `/api/activities/:id/definitions` | Добавить: `{seriesLength, reward, currency}` |
| `DELETE` | `/api/definitions/:id` | Удалить (если не единственная) |

### 2.5. Награды

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/activities/:id/rewards` | Список RewardIssue + computed earned/issued/unissued |
| `POST` | `/api/activities/:id/rewards` | Выдать награду: `{amount, currency, date}` |
| `PUT` | `/api/rewards/:id` | Обновить запись |
| `DELETE` | `/api/rewards/:id` | Удалить запись |

### 2.6. Серии (вычисляемые)

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/activities/:id/series?today=YYYY-MM-DD` | computeSeries для активности |

Параметр `today` — для поддержки перемотки времени (VirtualToday). Если не указан — используется реальное сегодня.

**Что освоишь**: HTTP-роутинг (`net/http` или `chi`), JSON-сериализация, статус-коды, обработка ошибок.

---

## Этап 3. Логика: порт с TypeScript на Go

### 3.1. `computeSeries()` — VISION algorithm v2

Исходный код: `src/utils/series.ts:27-138` (~110 строк TS).

План портирования:
1. Написать тесты в Go (таблица тест-кейсов из `computeSeries.test.ts`)
2. Реализовать `computeSeries(defs, completions, todayStr)` → `[]ComputedSeries`
3. Вспомогательные функции: `isGapBreak`, `addDays`, `defDate`

**Сложности порта:**
- Работа с датами: в Go используется `time.Time` из стандартной библиотеки, формат `"2006-01-02"`
- Сортировка: `sort.Slice` вместо `Array.sort()`
- Указатели: `EndDate *string` для nullable (Go не имеет `undefined`)

**Что освоишь**: `time` package, `sort.Slice`, указатели.

### 3.2. Расчёт наград

Исходный код: `src/utils/rewards.ts` (~35 строк, 4 функции).

Порт практически 1:1 — простые циклы и map-ы (в Go: `map[string]float64`).

**Что освоишь**: map-ы, `range`.

### 3.3. Дата-утилиты

Исходный код: `src/utils/date.ts` (~15 строк, 2 функции).

`today()` → `time.Now().Format("2006-01-02")`
`dayDiff()` → `time.Parse` + вычитание.

---

## Этап 4. Клиент: замена Dexie на fetch

### 4.1. Новый слой: `src/api/client.ts`

```ts
// src/api/client.ts
// Единый API-клиент. Заменяет прямые вызовы db.* в useActivities.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<{token: string}>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({email, password})
    }),

  login: (email: string, password: string) =>
    request<{token: string}>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({email, password})
    }),

  // Activities
  getActivities: () =>
    request<ActivityFull[]>('/api/activities'),

  createActivity: (name: string, seriesLength: number, reward: number, currency: string) =>
    request<ActivityFull>('/api/activities', {
      method: 'POST',
      body: JSON.stringify({name, seriesLength, reward, currency})
    }),

  updateActivity: (id: number, data: {name?: string; archived?: boolean}) =>
    request<ActivityFull>(`/api/activities/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    }),

  deleteActivity: (id: number) =>
    request<void>(`/api/activities/${id}`, {method: 'DELETE'}),

  // Completions
  toggleCompletion: (activityId: number, date: string) =>
    request<void>(`/api/activities/${activityId}/completions`, {
      method: 'POST', body: JSON.stringify({date})
    }),

  // Series (computed)
  getSeries: (activityId: number, today: string) =>
    request<ComputedSeries[]>(
      `/api/activities/${activityId}/series?today=${encodeURIComponent(today)}`
    ),

  // ... и так далее для остальных эндпоинтов
};
```

### 4.2. Изменения в `useActivities.ts`

Текущий хук обращается к Dexie напрямую. После миграции он будет вызывать `api.*` методы:

```ts
// Было:
await db.activities.add({name, archived: false, createdAt: new Date()});

// Стало:
await api.createActivity(name, seriesLength, reward, currency);
```

`liveQuery` заменится на:
- `useEffect` + `fetch` при монтировании
- Ручной инвалидации кеша после мутаций (или библиотека типа TanStack Query)

**Варианты для реактивности:**
- **TanStack Query (react-query)**: де-факто стандарт, кеширование, инвалидация, refetch. Тянет зависимость (~13 KB gzip).
- **Ручной `useEffect` + `useState`**: без зависимостей, больше кода, самим писать логику загрузки/ошибки/повтора.
- **Рекомендация**: TanStack Query — меньше boilerplate, лучше UX (кеш показывается сразу, refetch в фоне).

### 4.3. Авторизация на клиенте

Новые файлы:
```
src/
├── auth/
│   ├── AuthContext.tsx       # Провайдер: user, token, login/logout/register
│   └── LoginPage.tsx         # Простая форма логина/регистрации
│   └── LoginPage.css
```

`AuthContext`:
- Хранит JWT в `localStorage`
- При старте проверяет валидность токена
- `login()` / `register()` → сохраняет токен
- `logout()` → удаляет токен

Порядок работы:
1. Пользователь открывает приложение
2. Если нет токена → показывается `LoginPage`
3. Если токен есть → проверяется (запрос к `/api/activities`), если 401 → LoginPage
4. После логина → Dashboard

### 4.4. Что НЕ меняется на клиенте

- **Все UI-компоненты** — ActivityCard, ActivityAccordion, MonitoringPage, Dashboard, ArchivePage, TimeTravel, и т.д.
- **VirtualTodayContext** — остаётся как есть
- **i18n** — без изменений
- **Типы `ComputedSeries`, `ActivityWithStreak`** — остаются (могут быть небольшие правки под JSON-формат с сервера)
- **`utils/date.ts`** — остаётся для форматирования отображения (если где-то используется в UI)

---

## Этап 5. Деплой

### 5.1. Фронт: GitHub Pages

- В `vite.config.ts` добавить `base: '/Routine-Series/'`
- Собрать: `npm run build` → `dist/`
- Деплой через `gh-pages` пакет или GitHub Actions

### 5.2. Бекенд: Railway / Render

Оба сервиса умеют деплоить Go из репозитория или Dockerfile.

**Railway:**
- Бесплатный тир: $5 кредита, хватает на ~месяц работы 24/7
- Деплой из GitHub-репо: пушишь → билдится → запускается
- Автоматический HTTPS

**Render:**
- Бесплатный тир: 750 часов, сервер засыпает после 15 мин бездействия
- Просыпается за ~30 секунд при первом запросе
- Деплой из GitHub-репо

**Рекомендация**: Railway для начала — проще и не засыпает.

### 5.3. Конфигурация окружения

```env
# .env (для локальной разработки)
DB_PATH=./data/routine.db
JWT_SECRET=dev-secret-change-in-production
PORT=8080
CORS_ORIGIN=http://localhost:5173

# Railway/Render (переменные окружения в админке)
DB_PATH=/data/routine.db
JWT_SECRET=<сгенерированный-секрет>
PORT=8080
CORS_ORIGIN=https://vladislavkashafutdinov.github.io
```

### 5.4. Dockerfile

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
RUN CGO_ENABLED=0 go build -o /server ./main.go

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /server /server
RUN mkdir /data
ENV DB_PATH=/data/routine.db
ENV PORT=8080
EXPOSE 8080
CMD ["/server"]
```

---

## Этап 6. План работ (порядок)

### Фаза A: Сервер (Go) — ~5-7 вечеров

| # | Задача | Что изучить |
|---|---|---|
| A1 | `go mod init`, структура папок, `main.go` с "Hello World" сервером | `net/http`, `fmt` |
| A2 | `internal/db/` — подключение SQLite, создание таблиц | `database/sql`, `modernc.org/sqlite` |
| A3 | `internal/models/` — Go-структуры | struct, json-теги |
| A4 | `internal/auth/` — регистрация, логин, JWT middleware | `golang.org/x/crypto/bcrypt`, `golang-jwt/jwt/v5` |
| A5 | `internal/handlers/activities.go` — CRUD активностей | `json.NewDecoder`, `mux.Vars` (или chi) |
| A6 | `internal/handlers/completions.go` — тоггл отметок | SQL `INSERT OR REPLACE` / `DELETE` |
| A7 | `internal/handlers/definitions.go` + `rewards.go` | — |
| A8 | `internal/logic/series.go` — порт computeSeries | `time`, `sort.Slice`, тесты |
| A9 | `internal/logic/rewards.go` — порт расчёта наград | map, range |

### Фаза B: Клиент (React) — ~3-4 вечера

| # | Задача |
|---|---|
| B1 | `src/api/client.ts` — API-клиент |
| B2 | `src/auth/` — AuthContext + LoginPage |
| B3 | Замена `useActivities.ts` — вызовы `api.*` вместо Dexie |
| B4 | TanStack Query — обёртка для кеширования (или ручной fetch) |
| B5 | Удаление Dexie-зависимости, чистка `db/` |

### Фаза C: Деплой — ~1 вечер

| # | Задача |
|---|---|
| C1 | Dockerfile + деплой на Railway/Render |
| C2 | `vite.config.ts` → `base: '/Routine-Series/'` |
| C3 | Деплой фронта на GitHub Pages |
| C4 | Проверка: логин с телефона и ноутбука → одни и те же данные |

---

## Риски и решения

| Риск | Решение |
|---|---|
| Порт `computeSeries` расходится с оригиналом | Сначала написать тесты на Go из тех же кейсов, что в `computeSeries.test.ts`, потом реализовать |
| Реактивность `liveQuery` теряется | TanStack Query: мутация → инвалидация → авто-refetch. Либо polling раз в N секунд |
| Задержка сети ухудшает UX | Optimistic updates (TanStack Query), кеш показывается сразу |
| CORS проблемы при разработке | Go middleware: `Access-Control-Allow-Origin: http://localhost:5173` |
| Railway/Render засыпают/кончается бесплатный тир | Render: холодный старт ~30 сек. Railway: хватает на месяц. Дальше — $5/мес VPS |

---

## Что НЕ входит в этот план

- **Замена CSS на фреймворк** — отдельная задача в TODO
- **Роутинг на клиенте** — отдельная задача в TODO
- **Профили** — упомянуто в TODO как "Новые фичи на проработку"
- **Единая точка запуска** (иконка на рабочем столе) — отдельная задача
- **Supabase** — альтернатива, но несовместима с целью изучить Go

---

## Go-зависимости (go.mod)

```
module routine-series-server

go 1.23

require (
    modernc.org/sqlite v1.x     // чистый Go SQLite драйвер (не требует CGO)
    golang.org/x/crypto v0.x    // bcrypt
    github.com/golang-jwt/jwt/v5 // JWT
    github.com/go-chi/chi/v5    // лёгкий роутер (опционально, можно net/http)
)
```

Без chi — полностью на стандартной библиотеке, если хочется меньше внешних зависимостей.
С chi — удобнее роутинг (URL-параметры, группы, middleware), но `net/http` тоже справится.

---

*План создан 2026-07-20. Ожидает ревью.*
