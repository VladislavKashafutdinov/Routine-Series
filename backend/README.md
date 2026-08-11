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

## API

Swagger UI доступен по адресу `http://localhost:8080/swagger/`.
