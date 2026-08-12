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
| `DATABASE_URL` | Строка подключения к PostgreSQL (Neon) | обязательная |
| `PORT` | Порт HTTP-сервера | `8080` |
| `ALLOWED_ORIGINS` | CORS origins через запятую | — |

## Структура

```
cmd/server/         — точка входа
internal/
  models/           — структуры данных
  db/               — слой работы с БД
  handlers/         — HTTP-обработчики
  middleware/        — промежуточные слои
migrations/         — SQL-миграции
docs/               — сгенерированная OpenAPI-спецификация
```

## Деплой

Хост: [Render](https://render.com) (Free Tier, 512 MB RAM).

### Быстрый старт

1. Форкнуть репозиторий на GitHub (должен быть публичным)
2. Создать аккаунт на [render.com](https://render.com) (войти через GitHub)
3. Dashboard → New → Web Service → выбрать репозиторий
4. Render прочитает [`render.yaml`](../render.yaml) и заполнит поля:
   - **Runtime:** Go
   - **Root Directory:** `backend`
   - **Build Command:** `go build -o server ./cmd/server`
   - **Start Command:** `./server`
5. В разделе **Environment Variables** добавить:
   - `DATABASE_URL` — строка подключения к Neon PostgreSQL
6. Нажать **Deploy Web Service**

### Ручная настройка (без render.yaml)

Если Blueprint не сработал, создать Web Service вручную:

| Поле | Значение |
|---|---|
| Runtime | Go |
| Root Directory | `backend` |
| Build Command | `go build -o server ./cmd/server` |
| Start Command | `./server` |
| Health Check Path | `/api/v1/health` |
| Plan | Free |

### Ограничения Free Tier

- Сервер засыпает после 15 минут простоя
- Первый запрос после сна — задержка ~30 секунд
- 750 часов деплоя в месяц
- 100 GB трафика

## Docker

```bash
docker build -t routine-series-api .
docker run -p 8080:8080 -e DATABASE_URL=... routine-series-api
```

Образ: ~15 MB (multi-stage, alpine).

## API

Swagger UI доступен по адресу `http://localhost:8080/swagger/`.
