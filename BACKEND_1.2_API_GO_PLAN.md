# Детальный план пункта 1.2: API на Go с подключением к БД Neon

Ссылка на родительский план: [BACKEND_DEVELOPING_PLAN.md](BACKEND_DEVELOPING_PLAN.md) → п. 1.2

Порядок разработки: инфраструктура (сразу с работающим сервером) → фичи по одной (модели → CRUD → хендлеры → валидация → Swagger-аннотации) → деплой.
Каждый пункт завершается запуском `go run ./cmd/server` — сервер должен запуститься и ответить на проверочный запрос.

---

## 1. ✅ Инфраструктурам

### 1.1. Инициализация проекта
- [x] Создать Go-модуль в директории `backend/`
- [x] Создать структуру директорий: `cmd/server/`, `internal/models/`, `internal/db/`, `internal/handlers/`, `internal/middleware/`, `migrations/`
- [x] Добавить зависимости: `chi` (HTTP-роутер), `pgx` (драйвер PostgreSQL), `swaggo` (генератор OpenAPI)
- [x] Создать `backend/.env.example` с переменными `DATABASE_URL`, `PORT`, `ALLOWED_ORIGINS`
- [x] Написать `backend/README.md` с командами: `go run ./cmd/server`, `swag init`, сборка

### 1.2. Конфигурация, роутер и точка входа (скелет без хендлеров)
- [x] Определить общую структуру `ErrorResponse` с полем `error` — единый формат ошибок для всех эндпоинтов
- [x] Описать структуру `Config` с полем `Port` и чтением из `PORT` (дефолт `8080`)
- [x] Создать chi-роутер с тремя middleware: `Recoverer` (защита от паники), логгер (метод, путь, статус, длительность), `Content-Type: application/json`
- [x] Реализовать `cmd/server/main.go`: загрузка конфига → создание chi-роутера с middleware → запуск HTTP-сервера
- [x] Настроить graceful shutdown: перехват SIGINT/SIGTERM, остановка сервера с таймаутом 30с

**Проверка:** `go run ./cmd/server` → сервер стартует, любой запрос возвращает 404 (хендлеров ещё нет)

### 1.3. OpenAPI / Swagger (инфраструктура)
- [x] Аннотировать `main.go` базовыми Swaggo-комментариями (название API, версия, описание, хост)
- [x] Выполнить `swag init` для генерации `docs/swagger.json`
- [x] Настроить отдачу Swagger UI по маршруту `/swagger/`
- [x] Настроить отдачу `swagger.json` по маршруту `/api/v1/swagger.json`

**Проверка:** открыть `http://localhost:8080/swagger/` — Swagger UI загружается (спецификация пока пустая)

### 1.4. Подключение к БД + health-check
- [x] Добавить в `Config` поле `DatabaseURL` (переменная `DATABASE_URL`, без дефолта — обязательная)
- [x] Реализовать создание пула соединений к Neon PostgreSQL через `pgxpool` с параметрами `max_connections=10`, `min_connections=1`
- [x] Реализовать health-check при старте: `SELECT 1` — если БД недоступна, сервер завершается с понятной ошибкой
- [x] Реализовать структуру `App` для dependency injection (пул передаётся в обработчики)
- [x] Реализовать закрытие пула при graceful shutdown
- [x] Добавить хендлер `GET /api/v1/health` → `{"status":"ok"}` (проверяет `SELECT 1`)
- [x] Аннотировать хендлер Swaggo-комментарием (summary, success response)
- [x] Выполнить `swag init` повторно

**Проверка:** с валидным `DATABASE_URL` сервер стартует и health-check возвращает `{"status":"ok"}`; с невалидным — падает при старте с ошибкой; в Swagger UI эндпоинт виден.

### 1.5. Миграции базы данных
- [x] Установить `golang-migrate` как инструмент для миграций
- [x] Написать UP-миграцию: создание таблицы `activities` (id SERIAL PK, name TEXT NOT NULL, archived BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())
- [x] Написать UP-миграцию: создание таблицы `series_definitions` (id SERIAL PK, activity_id INT FK REFERENCES activities, series_length INT NOT NULL, reward NUMERIC NOT NULL DEFAULT 0, currency TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())
- [x] Написать UP-миграцию: создание таблицы `completions` (id SERIAL PK, activity_id INT FK REFERENCES activities, date DATE NOT NULL, UNIQUE(activity_id, date))
- [x] Написать UP-миграцию: создание таблицы `reward_issues` (id SERIAL PK, activity_id INT FK REFERENCES activities, date DATE NOT NULL, amount NUMERIC NOT NULL, currency TEXT NOT NULL)
- [x] Создать индексы: `completions(activity_id, date)`, `series_definitions(activity_id, created_at)`, `reward_issues(activity_id, date)`
- [x] Написать DOWN-миграции для отката каждой таблицы
- [x] Добавить автоматический запуск UP-миграций в `main.go` перед стартом HTTP-сервера

**Проверка:** после старта таблицы созданы в БД (видно в Neon-консоли или через `psql`)

**Результат после раздела 1:** сервер запускается, БД подключена, миграции применены, Swagger UI работает, health-check отдаёт `{"status":"ok"}`.

---

## 2. ✅ Создание активности

Один POST-эндпоинт, создающий активность вместе с первой версией определения серии в одной транзакции.

### 2.1. Модели
- [x] Определить структуру `Activity` с JSON-тегами: `id`, `name`, `archived`, `created_at`
- [x] Определить структуру `SeriesDefinition` с JSON-тегами: `id`, `activity_id`, `series_length`, `reward`, `currency`, `created_at`
- [x] Определить структуру `CreateActivityRequest` с полями `name`, `series_length`, `reward`, `currency`

### 2.2. CRUD-функция
- [x] Реализовать `CreateActivity(ctx, name, seriesLength, reward, currency) → ActivityWithDef` — вставка в `activities` и `series_definitions` в одной транзакции, возврат созданной активности с определением

### 2.3. HTTP-обработчик
- [x] `POST /api/v1/activities` — создание активности с параметрами серии (тело: `{name, series_length, reward, currency}`) → 201 + ActivityWithDef

### 2.4. Валидация
- [x] `name` непустой, не длиннее 255 символов, без пробелов по краям (trim)
- [x] `series_length` > 0
- [x] `reward` >= 0
- [x] `currency` непустой
- [x] Возвращать `400 {error: "..."}` при нарушении

### 2.5. Swagger-аннотация
- [x] Аннотировать обработчик Swaggo-комментарием (summary, params, success 201, error 400)
- [x] Выполнить `swag init`, проверить через Swagger UI

**Результат:** активность с параметрами серии создаётся одним запросом, обе записи — в одной транзакции.

---

## 3. ✅ Импорт данных

Один POST-эндпоинт, принимающий полный дамп данных (activities, series_definitions, completions, reward_issues) и вставляющий их в БД. Нужен для миграции из IndexedDB в PostgreSQL ([план родительского проекта](BACKEND_DEVELOPING_PLAN.md) → п. 3), а также для загрузки тестовых данных при разработке.

> Почему здесь: таблицы уже созданы миграциями (1.5), эндпоинт не зависит от других CRUD-ов. Импортированные данные будут сразу видны в GET-эндпоинтах раздела 4.

### 3.1. Модели
- Определить структуру `ImportPayload` с полями `activities`, `series_definitions`, `completions`, `reward_issues` — каждое поле содержит массив объектов соответствующего типа
- Определить структуру `ImportStats` с полями `activities`, `series_definitions`, `completions`, `reward_issues` — количество импортированных записей по каждой таблице

### 3.2. CRUD-функции
- Реализовать `ImportAll(ctx, payload) → ImportStats` — вставка всех данных в одной транзакции: сначала activities, затем series_definitions, completions, reward_issues (порядок важен из-за FK)
- Перед вставкой очищать все таблицы (`TRUNCATE ... CASCADE`) — импорт полный, не инкрементальный

### 3.3. HTTP-обработчик
- `POST /api/v1/import` — импортировать данные (тело: `ImportPayload`) → 200 + ImportStats

### 3.4. Валидация
- Проверять, что каждый объект в массивах содержит обязательные поля (name для activities, activity_id для completions и т.д.)
- Возвращать `400 {error: "..."}` при нарушении структуры данных

### 3.5. Swagger-аннотация
- Аннотировать обработчик Swaggo-комментарием
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** данные из браузерной БД импортируются одним запросом в PostgreSQL.

---

## 4. ✅ Просмотр активностей

Три GET-эндпоинта: список активных, список архивных, одна активность по id. Все возвращают ActivityWithDef (активность + актуальное определение серии).

### 4.1. Модели
- Определить структуру `ActivityWithDef` — Activity + вложенное актуальное SeriesDefinition

### 4.2. CRUD-функции
- Реализовать `GetAllActive(ctx) → []ActivityWithDef` — активные активности + актуальные определения
- Реализовать `GetAllArchived(ctx) → []ActivityWithDef` — архивные активности + актуальные определения
- Реализовать `GetByID(ctx, id) → ActivityWithDef` — одна активность + определение, 404 если не найдена

### 4.3. HTTP-обработчики
- `GET /api/v1/activities` — список активных → 200 + []
- `GET /api/v1/activities/archived` — список архивных → 200 + []
- `GET /api/v1/activities/{id}` — одна активность → 200 / 404

### 4.4. Валидация
- `id` в URL — положительное целое число

### 4.5. Swagger-аннотации
- Аннотировать 3 обработчика Swaggo-комментариями
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** активности читаются с актуальными параметрами серий — можно открыть в Swagger и увидеть данные, созданные в разделе 2.

---

## 5. ✅ Подготовка к деплою

> Почему здесь, а не раньше или позже:
> - Раньше (после раздела 1) — деплоить нечего, один health-check не даёт новой информации.
> - Здесь — уже готов полный CRUD для Activity (создание + чтение), есть что тестировать в облаке.
>   Заодно проверяется, что Neon доступен с хоста, а не только с localhost.
> - Позже — накапливается непроверенный в облаке код, проблемы с хостом обнаруживаются с запозданием.

- Создать `Dockerfile`: multi-stage сборка (Go-билд → минимальный образ на alpine)
- Проверить, что бинарник и образ укладываются в лимиты бесплатных хостов (Render Free: 512 MB RAM, Fly.io Free: 256 MB RAM)
- Выбрать хост для деплоя и задеплоить текущую версию API
- Описать процесс деплоя в `backend/README.md`
- Проверить в облаке через Swagger UI: создание и просмотр активностей работают, БД доступна

---

## 6. ✅ Переименование активности

Один PATCH-эндпоинт: обновление названия активности по id.

### 6.1. Модели
- Определить структуру `UpdateActivityRequest` с полем `name`

### 6.2. CRUD-функция
- Реализовать `UpdateName(ctx, id, name)` — обновление `name` по id

### 6.3. HTTP-обработчик
- `PATCH /api/v1/activities/{id}` — обновить имя (тело: `{name}`) → 200 / 404

### 6.4. Валидация
- `name` непустой, не длиннее 255 символов, trim
- `id` в URL — положительное целое число
- Возвращать `404 {error: "activity not found"}` если активность не существует

### 6.5. Swagger-аннотация
- Аннотировать обработчик Swaggo-комментарием
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** название активности меняется — проверяется через Swagger.

---

## 7. ✅ Архивирование и восстановление активности

Два POST-эндпоинта: отправить в архив и восстановить из архива (soft-delete).

### 7.1. CRUD-функции
- Реализовать `Archive(ctx, id)` — установка `archived = true`
- Реализовать `Restore(ctx, id)` — установка `archived = false`

### 7.2. HTTP-обработчики
- `POST /api/v1/activities/{id}/archive` — архивировать → 204 / 404
- `POST /api/v1/activities/{id}/restore` — восстановить из архива → 204 / 404

### 7.3. Валидация
- `id` в URL — положительное целое число
- Возвращать `404 {error: "activity not found"}` если активность не существует

### 7.4. Swagger-аннотации
- Аннотировать 2 обработчика Swaggo-комментариями
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** активность архивируется и восстанавливается — в списке активных больше не показывается, в списке архивных появляется.

---

## 8. ✅ Управление параметрами серии

Три эндпоинта для версионирования SeriesDefinition внутри существующей активности: создать новую версию, получить все версии, удалить версию.

### 8.1. Модели
- Определить структуру `CreateSeriesDefinitionRequest` с полями `series_length`, `reward`, `currency`

### 8.2. CRUD-функции
- Реализовать `CreateSeriesDefinition(ctx, activityID, seriesLength, reward, currency) → SeriesDefinition` — новая версия, `created_at` = now()
- Реализовать `GetSeriesDefinitions(ctx, activityID) → []SeriesDefinition` — все версии, сортировка по `created_at DESC`
- Реализовать `DeleteSeriesDefinition(ctx, id)` — удаление версии, ошибка если это последнее определение у активности

### 8.3. HTTP-обработчики
- `POST /api/v1/activities/{id}/series-definitions` — новая версия (тело: `{series_length, reward, currency}`) → 201
- `GET /api/v1/activities/{id}/series-definitions` — все версии → 200 + []
- `DELETE /api/v1/activities/{id}/series-definitions/{defId}` — удалить версию → 204 / 404 / 409

### 8.4. Валидация
- `series_length` > 0, `reward` >= 0, `currency` непустой
- `id` и `defId` — положительные целые числа
- Возвращать `409 {error: "..."}` при попытке удалить последнее определение

### 8.5. Swagger-аннотации
- Аннотировать 3 обработчика Swaggo-комментариями
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** параметры серии меняются через создание новой версии, история версий читается, версии удаляются (кроме последней).

---

## 9. ✅ Ежедневные отметки: toggle

Один POST-эндпоинт: если отметки за дату нет — создаёт, если есть — удаляет. Поведение как у кнопки «Отметить/Отменить» в UI.

### 9.1. Модели
- Определить структуру `Completion` с JSON-тегами: `id`, `activity_id`, `date`
- Определить структуру `ToggleCompletionRequest` с полями `activity_id`, `date`
- Определить структуру `ToggleCompletionResponse` с полями `created` (true — добавлена, false — удалена) и `completion`

### 9.2. CRUD-функция
- Реализовать `ToggleCompletion(ctx, activityID, date) → (created bool, Completion)` — если отметка есть → удалить, если нет → создать

### 9.3. HTTP-обработчик
- `POST /api/v1/completions/toggle` — переключить отметку (тело: `{activity_id, date}`) → 200 + `{created, completion}`

### 9.4. Валидация
- `date` соответствует формату YYYY-MM-DD
- `activity_id` ссылается на существующую и не архивную активность

### 9.5. Swagger-аннотация
- Аннотировать обработчик Swaggo-комментарием
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** toggle отметок работает — повторный запрос с теми же параметрами отменяет отметку.

---

## 10. Ежедневные отметки: просмотр

Один GET-эндпоинт: список отметок по активности и диапазону дат.

### 10.1. Модели
- Использовать `Completion` (из раздела 9)

### 10.2. CRUD-функция
- Реализовать `GetByActivityAndDateRange(ctx, activityID, from, to) → []Completion` — отметки в диапазоне дат

### 10.3. HTTP-обработчик
- `GET /api/v1/completions?activity_id={id}&from={date}&to={date}` — отметки в диапазоне → 200 + []

### 10.4. Валидация
- `activity_id` — положительное целое, ссылается на существующую активность
- `from` и `to` — формат YYYY-MM-DD, `from <= to`

### 10.5. Swagger-аннотация
- Аннотировать обработчик Swaggo-комментарием
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** отметки за период читаются — можно запросить, например, последние 30 дней для календаря.

---

## 11. Награды: создание и просмотр

Два эндпоинта: создать запись о выдаче награды и получить пагинированный список выдач по активности.

### 11.1. Модели
- Определить структуру `RewardIssue` с JSON-тегами: `id`, `activity_id`, `date`, `amount`, `currency`
- Определить структуру `CreateRewardIssueRequest` с полями `activity_id`, `date`, `amount`, `currency`

### 11.2. CRUD-функции
- Реализовать `CreateRewardIssue(ctx, req) → RewardIssue` — вставка записи о выдаче
- Реализовать `GetByActivityID(ctx, activityID, limit, offset) → ([]RewardIssue, total)` — пагинированный список, сортировка по `date DESC`

### 11.3. HTTP-обработчики
- `POST /api/v1/reward-issues` — создать выдачу (тело: `{activity_id, date, amount, currency}`) → 201
- `GET /api/v1/reward-issues?activity_id={id}&limit={n}&offset={n}` — список с пагинацией → 200 + `{items, total}`

### 11.4. Валидация
- `activity_id` ссылается на существующую активность
- `date` соответствует формату YYYY-MM-DD
- `amount` > 0, `currency` непустой

### 11.5. Swagger-аннотации
- Аннотировать 2 обработчика Swaggo-комментариями
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** награды создаются и читаются с пагинацией — можно выдать награду и увидеть её в списке.

---

## 12. Награды: редактирование

Один PATCH-эндпоинт: обновить сумму выданной награды.

### 12.1. Модели
- Определить структуру `UpdateRewardIssueRequest` с полем `amount`

### 12.2. CRUD-функция
- Реализовать `UpdateAmount(ctx, id, amount)` — обновление суммы

### 12.3. HTTP-обработчик
- `PATCH /api/v1/reward-issues/{id}` — обновить сумму (тело: `{amount}`) → 200 / 404

### 12.4. Валидация
- `id` в URL — положительное целое число
- `amount` > 0
- Возвращать `404 {error: "reward issue not found"}` если запись не существует

### 12.5. Swagger-аннотация
- Аннотировать обработчик Swaggo-комментарием
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** сумма выданной награды изменяется — проверяется через Swagger.

---

## 13. Награды: удаление

Один DELETE-эндпоинт: удалить запись о выдаче награды.

### 13.1. CRUD-функция
- Реализовать `DeleteByID(ctx, id)` — удаление записи

### 13.2. HTTP-обработчик
- `DELETE /api/v1/reward-issues/{id}` — удалить выдачу → 204 / 404

### 13.3. Валидация
- `id` в URL — положительное целое число
- Возвращать `404 {error: "reward issue not found"}` если запись не существует

### 13.4. Swagger-аннотация
- Аннотировать обработчик Swaggo-комментарием
- Выполнить `swag init`, проверить через Swagger UI

**Результат:** запись о выдаче удаляется — полный CRUD для RewardIssue завершён.

---

