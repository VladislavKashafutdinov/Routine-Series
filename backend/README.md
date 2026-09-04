# Routine Series — Go API

REST API для приложения Routine Series.

## Команды

```bash
go run ./cmd/server   # Запуск сервера (http://localhost:8080)
swag init -g cmd/server/main.go -o docs   # Генерация OpenAPI-спецификации
go build -o server ./cmd/server   # Сборка бинарника
```

## Переменные окружения

См. [.env.example](.env.example):

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL (внутренняя БД RelaxDev, `sslmode=disable`) | обязательная |
| `PORT` | Порт HTTP-сервера | `8080` |
| `ALLOWED_ORIGINS` | CORS origins через запятую, паттерны path.Match (`*` — wildcard) | `http://localhost:*,https://*.github.io` |

## Структура

```
cmd/server/         — точка входа
internal/
  activity/         — активности (модель + db + handlers)
  auth/             — email-авторизация (коды, сессии, mailer)
  completion/       — отметки выполнения
  reward/           — начисления наград
  seriesdefinition/ — параметры серий
  dataimport/       — импорт/экспорт данных
  dataload/         — агрегированная загрузка GET /api/v1/data
  dbpool/           — пул подключений + миграции
  api/              — контракт API (middleware, ошибки)
  app/              — инфраструктура приложения (логирование)
  health/           — health check
migrations/         — SQL-миграции
docs/               — сгенерированная OpenAPI-спецификация
```

## Деплой

Хост: [RelaxDev](https://relaxdev.ru) — Go-приложение + внутренняя управляемая PostgreSQL (приватная сеть, без Neon).

### Быстрый старт

1. Репозиторий на GitHub (публичный или приватный — RelaxDev поддерживает оба).
2. Аккаунт на RelaxDev → добавить проект из репозитория; корень проекта — `backend`, сборка — Go. Если платформа не подхватит `migrations/` при авто-сборке — переключить на Dockerfile `backend/Dockerfile` (он копирует папку миграций в контейнер).
3. В панели создать **База данных → PostgreSQL**; платформа выдаст внутренний `DATABASE_URL`.
4. Переменные окружения проекта:
   - `DATABASE_URL` — внутренняя БД RelaxDev; внутри платформы SSL не нужен: в URL не должно быть `sslmode=require` (можно явно `?sslmode=disable`). Если платформа добавила в URL параметры `connection_limit`/`pool_timeout` — удалить их (это параметры PgBouncer RelaxDev, стандартный PostgreSQL их не принимает).
   - `ALLOWED_ORIGINS` — например `https://vladislavkashafutdinov.github.io`.
   - `PORT` не задавать — платформа выдаёт сама.
   - Почтовые: `MAIL_PROVIDER=gmailapi` + `GMAIL_API_CLIENT_ID`/`GMAIL_API_CLIENT_SECRET`/`GMAIL_API_REFRESH_TOKEN` (см. [.env.example](.env.example)).
5. Деплой. Миграции применяются при старте из `migrations/` (текущая версия 2).

### Перенос данных из Neon

- Через pgAdmin: Backup БД Neon (Format: Plain, без owner/privileges) → в БД RelaxDev выполнить `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` → Restore. Plain-дамп содержит `setval(...)` для последовательностей.
- Встроенный импорт RelaxDev по URL Neon в нашем случае перенёс только схему — после него обязательно сверять счётчики всех таблиц.

### Тарифы и доступ

- Бесплатный период — 14 дней (триал); далее PRO 990 ₽/мес.
- БД живёт в приватной сети RelaxDev; снаружи доступна только при явном включении внешнего порта с whitelist IP (для внешних подключений нужен `sslmode=require`).

### Настройки пула подключений

Приложение держит собственный пул pgxpool: `ConnectTimeout=5s`, `PingTimeout=5s`, `HealthCheckPeriod=30s` ([internal/dbpool](internal/dbpool)). Для логирования запросов к БД можно включить `DEBUG_PGX_QUERIES=1`.

## Docker

```bash
docker build -t routine-series-api .
docker run -p 8080:8080 -e DATABASE_URL=... routine-series-api
```

Образ: ~15 MB (multi-stage, alpine).

## API

Swagger UI доступен по адресу `http://localhost:8080/swagger/`.
