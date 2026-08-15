# Целевая схема вложенности компонентов

```
App
├── AppHeader
│   ├── LangSwitcher
│   ├── PageTabs                («Выполнение» | «Мониторинг» | «Архив»)
│   └── TimeTravel              (◀ YYYY-MM-DD ▶ «Сегодня»)
│
├── [«Выполнение»] Dashboard
│   ├── AddActivity             (название + длина/награда/валюта)
│   ├── Список предложений к начислению ⏳
│   │   └── По каждой активности: unissued > 0 по валютам → кнопка «Начислить»
│   ├── Section «Не выполнено»
│   │   └── ActivityCard[]
│   │       ├── EditableName
│   │       ├── SeriesProgress  (квадратики, только отображение)
│   │       ├── MarkDoneButton  («Отметить»)
│   │       └── DeleteButton
│   └── Section «Выполнено»
│       └── ActivityCard[]
│           ├── EditableName
│           ├── SeriesProgress  (квадратики, только отображение)
│           ├── UndoButton      («Отменить»)
│           └── DeleteButton
│
├── [«Мониторинг»] MonitoringPage
│   └── ActivityAccordion[]
│       ├── Заголовок: activity.name + unissued counter per-currency (только если >0) + кнопка «Начислить» per-currency + отображение текущей серии (findCurrentSeries)
│       ├── IssueRewardModal    (дата/сумма/валюта → addRewardIssue)
│       ├── TabSwitcher («SeriesDefinition» / «История начислений» / «История серий» / «Completions»)
│       ├── [«SeriesDefinition»] SeriesDefinitionTab
│       │   └── Список всех SeriesDefinition + добавление + удаление (createdAt >= virtualToday, не единственная)
│       ├── [«История начислений»] RewardHistoryTab
│       │   ├── RewardCounters  (счётчики по каждой валюте)
│       │   ├── Таблица RewardIssue (дата | сумма | валюта | действия)
│       │   ├── EditableCell    (inline-редактирование)
│       │   ├── DeleteButton    (с подтверждением)
│       │   └── Paginator
│       ├── [«История серий»] SeriesHistoryTab
│       │   ├── Группы по SeriesDefinition
│       │   │   └── SeriesWidget[]  (статус, квадратики с кликами, даты)
│       │   └── Paginator
│       └── [«Completions»] CompletionsTab
│           └── Календарь по месяцам (по 3 месяца, пагинация)
│               └── Клик по дню → тоггл completion
│
└── [«Архив»] ArchivePage
    └── ArchivedActivityRow[]
        ├── Название + количество completions (информационно)
        └── RestoreButton (с подтверждением)
```
