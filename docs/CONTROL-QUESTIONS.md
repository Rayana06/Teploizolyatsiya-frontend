# Контрольные вопросы

## Redux Toolkit: reducer, store, middleware

`Store` — единое хранилище state. `Reducer` — чистая функция, которая по текущему state и action формирует новый state. `Middleware` стоит между `dispatch` и reducer: может логировать, менять или отложенно диспатчить action. `configureStore` в Redux Toolkit сразу подключает Redux Thunk, DevTools и проверки в dev-режиме.

`createSlice` объединяет имя, initial state, reducers и action creators. «Мутирующий» синтаксис reducers безопасен: Immer создаёт новое иммутабельное состояние.

## Axios

Axios — HTTP-клиент на Promise. Он умеет base URL, timeout, interceptors, автоматический JSON и `withCredentials`. В работе instance с `baseURL: '/api'` и `withCredentials: true` используется как mutator для Orval.

## Local Storage

`localStorage` — синхронное хранилище строк по origin, без автоматического TTL. Оно доступно JavaScript, поэтому чувствительный session token там уязвим при XSS. В работе session ID хранится в HttpOnly-cookie; Redux намеренно не персистентен.

## CORS и обратный proxy

CORS — браузерная политика доступа между origin. Reverse proxy принимает `/api` на origin frontend и сам обращается к backend, поэтому для браузера нет cross-origin AJAX. Отдельный `/silo` маршрут ведёт к MinIO.

## BFF и GraphQL

BFF (Backend for Frontend) — отдельный backend под нужды конкретного UI: агрегирует сервисы, скрывает внутреннюю топологию и возвращает нужный UI DTO. GraphQL даёт клиенту типизированную схему и выбор полей, снижая overfetching, но требует контроля сложности запросов и кеширования.

## Next.js и SSG

Next.js — React-фреймворк с файловой маршрутизацией, server components, SSR/SSG и backend-маршрутами. SSG формирует HTML на этапе сборки: быстро и CDN-friendly, но динамические данные нужно обновлять на клиенте, пересобирать или ISR.

## FSD

Feature-Sliced Design делит frontend по уровням `app`, `pages`, `widgets`, `features`, `entities`, `shared`. Зависимости направлены вниз: верхний слой может использовать нижний, но не наоборот. Слайсы изолируют предметные области и открывают public API.
