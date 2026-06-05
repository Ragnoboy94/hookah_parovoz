# Паровоз — сайт кальянной

Автономный лендинг с админ-панелью. Не зависит от Hookah.Work — весь контент хранится локально в `data/content.json`.

## Возможности

- Красивый тёмный лендинг с акцентным цветом бренда
- Статус «открыто / закрыто» по расписанию (часовой пояс Калининград)
- Меню с категориями и ценами
- Контакты, адрес, часы работы
- Соцсети и ссылки на отзывы
- Яндекс.Метрика
- Админ-панель `/admin` для редактирования всего контента
- Онлайн-бронирование столиков `/booking`
- Управление бронями `/admin/bookings` (зал сегодня, блокировка столов, заявки)
- Telegram-уведомления о новых бронях

## Запуск

```bash
npm install
cp .env.example .env.local
# Задайте ADMIN_PASSWORD в .env.local

npm run dev
```

Сайт: http://localhost:3000  
Админка: http://localhost:3000/admin  
Бронирования: http://localhost:3000/admin/bookings  
Бронь для гостей: http://localhost:3000/booking

## Деплой

Подойдёт любой VPS или хостинг с Node.js:

```bash
npm run build
npm start
```

На сервере задайте переменную `ADMIN_PASSWORD` и убедитесь, что папка `data/` доступна для записи (админка сохраняет изменения в `data/content.json`).

### Telegram-уведомления

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Добавьте бота в чат админов (или напишите ему лично)
3. Узнайте Chat ID (например через [@userinfobot](https://t.me/userinfobot) или `@getidsbot`)
4. В `.env.local` задайте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
5. В `/admin/bookings` → Настройки → включите уведомления и нажмите «Тест»

### Nginx (пример)

Проксируйте домен `parovoz1507.hookah.name` на порт 3000:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Структура

- `data/content.json` — весь контент сайта
- `src/app/page.tsx` — лендинг
- `src/app/admin/` — админ-панель
- `src/app/api/` — API для контента и авторизации
