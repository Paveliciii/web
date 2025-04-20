# Sales Analytics Dashboard

Полнофункциональное веб-приложение для анализа данных о продажах с интерактивными графиками и таблицами.

## Структура проекта

- `frontend/` - React-приложение с использованием TypeScript и Tailwind CSS
- `backend/` - Express API-сервер на Node.js с PostgreSQL

## Деплой

### Требования

- Node.js 16+
- PostgreSQL
- Git

### Локальный запуск

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/Paveliciii/web.git
   cd web
   ```

2. Настройка бэкенда:
   ```
   cd backend
   npm install
   npm run build
   npm start
   ```

3. Настройка фронтенда:
   ```
   cd frontend
   npm install
   npm start
   ```

### Деплой на Render.com

1. Создайте аккаунт на [Render.com](https://render.com)
2. Подключите свой GitHub репозиторий
3. Создайте базу данных PostgreSQL
4. Создайте веб-сервис для бэкенда:
   - Настройте переменные окружения:
     - `DATABASE_URL`: URL подключения к PostgreSQL
     - `NODE_ENV`: `production`
5. Настройте деплой фронтенда на GitHub Pages

## API Endpoints

- `/api/analytics/summary` - Общая статистика продаж
- `/api/analytics/by-region` - Продажи по регионам
- `/api/analytics/by-product` - Продажи по товарам
- `/api/analytics/trend` - Тренд продаж по времени
- `/api/regions` - Управление регионами
- `/api/products` - Управление товарами
- `/api/orders` - Управление заказами
- `/api/import/csv` - Импорт данных из CSV
- `/api/export/csv` - Экспорт данных в CSV

## Лицензия

MIT 